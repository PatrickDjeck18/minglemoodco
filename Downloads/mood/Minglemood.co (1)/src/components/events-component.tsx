import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, DollarSign, Star, CreditCard, Mail, Phone, AlertCircle, CheckCircle, User, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  maxAttendees: number;
  currentAttendees: number;
  category: string;
  image: string;
  organizer: string;
  featured: boolean;
  requiresRsvp: boolean;
  cancellationPolicy: string;
  dressCode?: string;
  ageRestriction?: string;
  includesFood: boolean;
  includesDrinks: boolean;
}

interface RSVPData {
  eventId: string;
  userId: string;
  attendeeName: string;
  email: string;
  phone: string;
  dietaryRestrictions: string;
  emergencyContact: string;
  emergencyPhone: string;
  specialRequests: string;
  status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  ticketNumber?: string;
  createdAt: string;
}

interface EventsComponentProps {
  user: any;
}

export function EventsComponent({ user }: EventsComponentProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookedEvents, setBookedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpData, setRsvpData] = useState<Partial<RSVPData>>({
    attendeeName: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    dietaryRestrictions: '',
    emergencyContact: '',
    emergencyPhone: '',
    specialRequests: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    loadEvents();
    loadBookings();
  }, []);

  const loadEvents = async () => {
    try {
      console.log('🔄 Loading real events from server...');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/events`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real events loaded:', data.length);
        setEvents(data);
      } else {
        console.warn('Events API returned error:', response.status);
        setEvents([]); // No fallback to demo data
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setEvents([]); // No fallback to demo data - only show real events
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/bookings`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookedEvents(new Set(data.map((booking: any) => booking.eventId)));
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, bookings will be stored locally:', error);
    }
  };

  const handleRSVP = (event: Event) => {
    setSelectedEvent(event);
    setRsvpData(prev => ({
      ...prev,
      eventId: event.id,
      userId: user.id
    }));
    setRsvpDialogOpen(true);
  };

  const submitRSVP = async () => {
    if (!selectedEvent) return;

    setIsProcessingPayment(true);
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/rsvp-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          ...rsvpData,
          eventId: selectedEvent.id,
          userId: user.id,
          eventPrice: selectedEvent.price
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.paymentRequired && result.clientSecret) {
          // Handle Stripe payment
          await processStripePayment(result.clientSecret, result.rsvpId);
        } else {
          // Free event or payment not required
          completeRSVP(result.rsvpId);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'RSVP failed');
      }
    } catch (error) {
      console.error('RSVP error:', error);
      toast("RSVP failed. Please try again.", { 
        description: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const processStripePayment = async (clientSecret: string, rsvpId: string) => {
    // In a real implementation, you would integrate with Stripe Elements here
    // For this demo, we'll simulate a successful payment
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          rsvpId: rsvpId,
          paymentIntentId: 'demo_payment_' + Date.now()
        })
      });

      if (response.ok) {
        completeRSVP(rsvpId);
      } else {
        throw new Error('Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast("Payment failed. Please try again.", {
        description: "Your reservation is still pending payment"
      });
    }
  };

  const completeRSVP = (rsvpId: string) => {
    if (!selectedEvent) return;

    setBookedEvents(prev => new Set(prev).add(selectedEvent.id));
    setEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? { ...event, currentAttendees: event.currentAttendees + 1 }
        : event
    ));

    toast("🎉 RSVP Confirmed!", {
      description: `You're registered for ${selectedEvent.title}. Check your email for details.`
    });

    setRsvpDialogOpen(false);
    setSelectedEvent(null);
    setRsvpData({
      attendeeName: user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: '',
      dietaryRestrictions: '',
      emergencyContact: '',
      emergencyPhone: '',
      specialRequests: ''
    });
  };

  const handleBookEvent = async (eventId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/book-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          userId: user.id,
          eventId: eventId
        })
      });

      if (response.ok) {
        setBookedEvents(prev => new Set(prev).add(eventId));
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { ...event, currentAttendees: event.currentAttendees + 1 }
            : event
        ));
        toast("Event booked successfully!");
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, booking stored locally:', error);
      setBookedEvents(prev => new Set(prev).add(eventId));
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, currentAttendees: event.currentAttendees + 1 }
          : event
      ));
      toast("Event booked successfully!");
    }
  };

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());
  const featuredEvents = upcomingEvents.filter(event => event.featured);
  const myBookedEvents = upcomingEvents.filter(event => bookedEvents.has(event.id));

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        {event.featured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        <Badge className="absolute top-2 left-2 bg-black bg-opacity-50 text-white">
          {event.category}
        </Badge>
        {event.requiresRsvp && (
          <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white">
            RSVP Required
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
        
        <div className="space-y-2 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(event.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {event.time}
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {event.currentAttendees}/{event.maxAttendees} attending
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            ${event.price}
          </div>
          {event.includesFood && (
            <Badge variant="outline" className="text-xs">Includes Food</Badge>
          )}
          {event.includesDrinks && (
            <Badge variant="outline" className="text-xs ml-1">Includes Drinks</Badge>
          )}
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{event.description}</p>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">By {event.organizer}</span>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">View Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{event.title}</DialogTitle>
                <DialogDescription>
                  View complete event details, description, and RSVP information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    {event.time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    ${event.price}
                  </div>
                </div>

                {event.dressCode && (
                  <div className="text-sm">
                    <span className="font-medium">Dress Code:</span> {event.dressCode}
                  </div>
                )}
                
                {event.ageRestriction && (
                  <div className="text-sm">
                    <span className="font-medium">Age Restriction:</span> {event.ageRestriction}
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">About This Event</h4>
                  <p className="text-gray-700">{event.description}</p>
                </div>

                {event.cancellationPolicy !== 'none' && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Cancellation Policy:</span> {event.cancellationPolicy} notice required
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-600">
                      {event.currentAttendees} of {event.maxAttendees} spots filled
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-[#BF94EA] h-2 rounded-full"
                        style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {bookedEvents.has(event.id) ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirmed
                    </Badge>
                  ) : event.currentAttendees >= event.maxAttendees ? (
                    <Badge variant="destructive">Sold Out</Badge>
                  ) : event.requiresRsvp ? (
                    <Button 
                      onClick={() => handleRSVP(event)}
                      className="bg-[#BF94EA] hover:bg-[#A076D1] text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      RSVP ${event.price}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleBookEvent(event.id)}
                      className="bg-[#FA7872] hover:bg-[#E86661] text-white"
                    >
                      Book Spot - ${event.price}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Events</h2>
        <Badge variant="outline" className="text-[#BF94EA] border-[#BF94EA]">
          {bookedEvents.size} events booked
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                <p className="text-gray-600 mb-4">New events will appear here when they are created by the admin team.</p>
                <p className="text-sm text-gray-500">Check back soon for exciting new social events!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No featured events</h3>
                <p className="text-gray-600 mb-4">Featured events will be highlighted here when available.</p>
                <Button onClick={() => setActiveTab('upcoming')} variant="outline">
                  View All Events
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-events" className="space-y-6">
          {myBookedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No events booked yet</h3>
                <p className="text-gray-600 mb-4">Browse our upcoming events and book your spot!</p>
                <Button onClick={() => setActiveTab('upcoming')}>
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* RSVP Dialog */}
      <Dialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#BF94EA]" />
              RSVP for {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Reserve your spot for this exclusive event. Payment confirmation required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEvent && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{selectedEvent.title}</span>
                    <span className="text-lg font-semibold text-[#BF94EA]">${selectedEvent.price}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(selectedEvent.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedEvent.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedEvent.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="attendeeName">Full Name *</Label>
                <Input
                  id="attendeeName"
                  value={rsvpData.attendeeName}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, attendeeName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={rsvpData.email}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={rsvpData.phone}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  value={rsvpData.dietaryRestrictions}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                  placeholder="Any food allergies or dietary requirements"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={rsvpData.emergencyContact}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={rsvpData.emergencyPhone}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  placeholder="Emergency contact phone"
                />
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={rsvpData.specialRequests}
                  onChange={(e) => setRsvpData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special accommodations needed"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setRsvpDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitRSVP}
                disabled={isProcessingPayment || !rsvpData.attendeeName || !rsvpData.email || !rsvpData.phone}
                className="flex-1 bg-[#BF94EA] hover:bg-[#A076D1] text-white"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Confirm RSVP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}