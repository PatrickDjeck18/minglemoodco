import React, { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap, Heart, Calendar, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface UserStats {
  profileViews: number;
  likes: number;
  matches: number;
  eventsAttended: number;
  memberSince: string;
}

interface SubscriptionComponentProps {
  user: any;
}

export function SubscriptionComponent({ user }: SubscriptionComponentProps) {
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/subscription`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.plan);
        setUserStats(data.stats);
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, using demo subscription data:', error);
      // Set demo data
      setUserStats({
        profileViews: 127,
        likes: 23,
        matches: 8,
        eventsAttended: 3,
        memberSince: 'January 2024'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: 'basic',
      name: 'Basic Member',
      price: 0,
      period: 'month',
      features: [
        'Access to 50 profiles per day',
        'Basic matching algorithm',
        'Event announcements',
        'Community forum access',
        'Basic customer support'
      ],
      current: currentPlan === 'basic'
    },
    {
      id: 'premium',
      name: 'Premium Elite',
      price: 97,
      period: 'month',
      features: [
        'Unlimited profile browsing',
        'Advanced matching algorithm',
        'Priority event booking',
        'Exclusive premium events',
        'Read receipts & advanced messaging',
        'Profile boost (2x visibility)',
        'See who liked you',
        'Video chat features',
        'Priority customer support'
      ],
      popular: true,
      current: currentPlan === 'premium'
    },
    {
      id: 'platinum',
      name: 'Platinum Exclusive',
      price: 197,
      period: 'month',
      features: [
        'Everything in Premium Elite',
        'Personal matchmaking consultation',
        'VIP-only exclusive events',
        'Personal concierge service',
        'Travel companion matching',
        'Background verification included',
        'Custom event planning',
        'Direct line to relationship coach',
        '24/7 white-glove support'
      ],
      current: currentPlan === 'platinum'
    }
  ];

  const handleUpgrade = async (tierId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          userId: user.id,
          planId: tierId
        })
      });

      if (response.ok) {
        setCurrentPlan(tierId);
        // In a real app, this would redirect to payment processing
        alert(`Upgrade to ${subscriptionTiers.find(t => t.id === tierId)?.name} successful!`);
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, simulating upgrade:', error);
      // Still update UI for demo purposes
      setCurrentPlan(tierId);
      alert(`Demo: Upgrade to ${subscriptionTiers.find(t => t.id === tierId)?.name} successful!`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Overview */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-pink-600" />
              <span>Your Membership</span>
            </CardTitle>
            <Badge className="bg-pink-600 text-white">
              {subscriptionTiers.find(t => t.id === currentPlan)?.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-2">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{userStats.profileViews}</div>
                <div className="text-sm text-gray-600">Profile Views</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-2">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{userStats.likes}</div>
                <div className="text-sm text-gray-600">Likes Received</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-2">
                  <Zap className="h-6 w-6 text-pink-600" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{userStats.matches}</div>
                <div className="text-sm text-gray-600">Mutual Matches</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-2">
                  <Calendar className="h-6 w-6 text-pink-600" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{userStats.eventsAttended}</div>
                <div className="text-sm text-gray-600">Events Attended</div>
              </div>
            </div>
          )}
          
          <Separator className="my-6" />
          
          <div className="text-center">
            <p className="text-gray-600">
              Member since <span className="font-medium">{userStats?.memberSince}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Experience</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock exclusive features and premium events with our membership tiers designed for discerning singles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {subscriptionTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.popular ? 'border-pink-300 shadow-lg scale-105' : ''} ${tier.current ? 'bg-pink-50 border-pink-300' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-pink-600 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {tier.current && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-600 text-white">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${tier.price}
                  </span>
                  <span className="text-gray-600">/{tier.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6">
                  {tier.current ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : tier.price === 0 ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={currentPlan === 'basic'}
                    >
                      {currentPlan === 'basic' ? 'Current Plan' : 'Downgrade'}
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${tier.popular ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                      onClick={() => handleUpgrade(tier.id)}
                    >
                      {currentPlan === 'basic' ? 'Upgrade Now' : 'Switch Plan'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Why Upgrade to Premium?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Better Matches</h3>
              <p className="text-sm text-gray-600">Advanced algorithm finds more compatible connections</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Exclusive Events</h3>
              <p className="text-sm text-gray-600">Access to premium and VIP-only social events</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">VIP Treatment</h3>
              <p className="text-sm text-gray-600">Priority support and personalized service</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Enhanced Features</h3>
              <p className="text-sm text-gray-600">Advanced messaging, boosts, and profile insights</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">Need Help Choosing?</h3>
          <p className="text-gray-600 mb-4">
            Our membership specialists are here to help you find the perfect plan for your dating goals.
          </p>
          <Button variant="outline">
            Schedule a Consultation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}