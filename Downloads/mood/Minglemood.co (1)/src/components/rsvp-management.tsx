import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

interface RSVP {
  id: string;
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
  ticketNumber: string;
  createdAt: string;
  eventPrice: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
}

export function RSVPManagement() {
  const [rsvps, setRSVPs] = useState<RSVP[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [selectedRSVP, setSelectedRSVP] = useState<RSVP | null>(null);

  useEffect(() => {
    loadRSVPs();
    loadEvents();
  }, []);

  const loadRSVPs = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/rsvps`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRSVPs(data);
      }
    } catch (error) {
      console.error('Error loading RSVPs:', error);
      // No demo data - only show real RSVPs
      setRSVPs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/events`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // No demo data - only show real events
      setEvents([]);
    }
  };

  const updateRSVPStatus = async (rsvpId: string, newStatus: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/update-rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          rsvpId,
          status: newStatus
        })
      });

      if (response.ok) {
        setRSVPs(prev => prev.map(rsvp => 
          rsvp.id === rsvpId ? { ...rsvp, status: newStatus as any } : rsvp
        ));
        toast(`RSVP status updated to ${newStatus}`);
      } else {
        throw new Error('Failed to update RSVP status');
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast("Failed to update RSVP status");
    }
  };

  const exportRSVPs = () => {
    const filteredRSVPs = getFilteredRSVPs();
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Event', 'Status', 'Payment Status', 'Ticket Number', 'Created Date'].join(','),
      ...filteredRSVPs.map(rsvp => [
        rsvp.attendeeName,
        rsvp.email,
        rsvp.phone,
        rsvp.eventId,
        rsvp.status,
        rsvp.paymentStatus,
        rsvp.ticketNumber,
        new Date(rsvp.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvps.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilteredRSVPs = () => {
    return rsvps.filter(rsvp => {
      const matchesSearch = rsvp.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rsvp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || rsvp.status === statusFilter;
      const matchesEvent = eventFilter === 'all' || rsvp.eventId === eventFilter;
      
      return matchesSearch && matchesStatus && matchesEvent;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'waitlist':
        return <Badge className="bg-blue-500"><Users className="h-3 w-3 mr-1" />Waitlist</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRSVPs = getFilteredRSVPs();

  const stats = {
    total: rsvps.length,
    confirmed: rsvps.filter(r => r.status === 'confirmed').length,
    pending: rsvps.filter(r => r.status === 'pending').length,
    totalRevenue: rsvps.filter(r => r.paymentStatus === 'completed').reduce((sum, r) => sum + r.eventPrice, 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-[#BF94EA]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-[#BF94EA]">${stats.totalRevenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#BF94EA]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>RSVP Management</CardTitle>
            <Button onClick={exportRSVPs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RSVP List */}
          <div className="space-y-4">
            {filteredRSVPs.map((rsvp) => (
              <Card key={rsvp.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{rsvp.attendeeName}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {rsvp.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {rsvp.phone}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Event Details</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Event ID: {rsvp.eventId}</div>
                          <div>Ticket: {rsvp.ticketNumber}</div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${rsvp.eventPrice}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Status</p>
                        <div className="space-y-2">
                          {getStatusBadge(rsvp.status)}
                          {getPaymentStatusBadge(rsvp.paymentStatus)}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Created</p>
                        <p className="text-sm text-gray-600">
                          {new Date(rsvp.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(rsvp.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRSVP(rsvp)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>RSVP Details - {rsvp.attendeeName}</DialogTitle>
                            <DialogDescription>
                              View comprehensive RSVP information, payment details, and attendance status.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRSVP && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-medium">Personal Information</Label>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Name:</strong> {selectedRSVP.attendeeName}</p>
                                    <p><strong>Email:</strong> {selectedRSVP.email}</p>
                                    <p><strong>Phone:</strong> {selectedRSVP.phone}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="font-medium">Emergency Contact</Label>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Name:</strong> {selectedRSVP.emergencyContact || 'Not provided'}</p>
                                    <p><strong>Phone:</strong> {selectedRSVP.emergencyPhone || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>

                              {selectedRSVP.dietaryRestrictions && (
                                <div>
                                  <Label className="font-medium">Dietary Restrictions</Label>
                                  <p className="text-sm bg-yellow-50 p-2 rounded">
                                    {selectedRSVP.dietaryRestrictions}
                                  </p>
                                </div>
                              )}

                              {selectedRSVP.specialRequests && (
                                <div>
                                  <Label className="font-medium">Special Requests</Label>
                                  <p className="text-sm bg-blue-50 p-2 rounded">
                                    {selectedRSVP.specialRequests}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-medium">RSVP Status</Label>
                                  <Select 
                                    value={selectedRSVP.status} 
                                    onValueChange={(value) => updateRSVPStatus(selectedRSVP.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="waitlist">Waitlist</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="font-medium">Payment Status</Label>
                                  <div className="mt-2">
                                    {getPaymentStatusBadge(selectedRSVP.paymentStatus)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {rsvp.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => updateRSVPStatus(rsvp.id, 'confirmed')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateRSVPStatus(rsvp.id, 'cancelled')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredRSVPs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No RSVPs Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' || eventFilter !== 'all' 
                      ? 'No RSVPs match your current filters.' 
                      : 'No RSVPs have been submitted yet.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}