import React, { useState, useEffect } from 'react';
import { UserX, Search, Download, Eye, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface DeactivatedProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  profession?: string;
  deactivatedAt: string;
  reason: string;
  originalProfileData: any;
  membershipStatus: string;
}

interface ProfileDeactivationManagerProps {
  user?: any;
}

export function ProfileDeactivationManager({ user }: ProfileDeactivationManagerProps) {
  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
  const [deactivatedProfiles, setDeactivatedProfiles] = useState<DeactivatedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Real data will be loaded from API

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      // Get the current user's access token for admin API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        setActiveProfiles([]);
        setDeactivatedProfiles([]);
        setLoading(false);
        return;
      }

      // Load real users from admin API
      const usersResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (usersResponse.ok) {
        const realUsers = await usersResponse.json();
        
        // Transform users into profile format
        const transformedActiveProfiles = realUsers
          .filter(user => user.is_active !== false) // Active users only
          .map(user => ({
            id: user.id,
            name: user.name || 'Profile Incomplete',
            email: user.email,
            phone: user.phone || 'Not provided',
            age: user.age || 'Not specified',
            profession: user.profession || user.occupation || 'Not specified',
            joinedAt: user.created_at,
            lastActive: user.last_sign_in_at || user.created_at,
            eventsAttended: 0, // Would need to calculate from events data
            membershipStatus: user.subscription_plan === 'premium' ? 'Active Premium' : 
                             user.subscription_plan === 'platinum' ? 'Active Platinum' : 'Active',
            profileComplete: user.profile_complete || false,
            surveyComplete: user.survey_completed || false
          }));

        // Load deactivated profiles from KV store
        const deactivatedResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/deactivated-profiles`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        let deactivatedProfilesData = [];
        if (deactivatedResponse.ok) {
          deactivatedProfilesData = await deactivatedResponse.json();
        }

        setActiveProfiles(transformedActiveProfiles);
        setDeactivatedProfiles(deactivatedProfilesData);
        
      } else {
        setActiveProfiles([]);
        setDeactivatedProfiles([]);
      }

    } catch (error) {
      // Set empty arrays if real data fails - this is expected if backend is not available
      setActiveProfiles([]);
      setDeactivatedProfiles([]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateProfile = async () => {
    if (!selectedProfile || !deactivationReason.trim()) return;

    try {
      console.log('🔄 Deactivating profile:', selectedProfile.email);
      
      // Get the current user's access token for admin API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session found');
      }

      // Send deactivation request to server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/deactivate-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedProfile.id,
          reason: deactivationReason
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile deactivated successfully:', result);

        // Create deactivated profile entry for local state
        const deactivatedProfile: DeactivatedProfile = {
          id: `deact_${selectedProfile.id}`,
          name: selectedProfile.name,
          email: selectedProfile.email,
          phone: selectedProfile.phone,
          age: selectedProfile.age,
          profession: selectedProfile.profession,
          deactivatedAt: new Date().toISOString(),
          reason: deactivationReason,
          membershipStatus: 'Deactivated',
          originalProfileData: {
            joinedAt: selectedProfile.joinedAt,
            eventsAttended: selectedProfile.eventsAttended,
            profileComplete: selectedProfile.profileComplete,
            surveyComplete: selectedProfile.surveyComplete
          }
        };

        // Update local state
        setActiveProfiles(prev => prev.filter(p => p.id !== selectedProfile.id));
        setDeactivatedProfiles(prev => [deactivatedProfile, ...prev]);

        // Reset state
        setSelectedProfile(null);
        setDeactivationReason('');
        setShowDeactivateDialog(false);

        alert(`Profile for ${selectedProfile.name} has been deactivated successfully.`);
      } else {
        const errorData = await response.text();
        console.error('❌ Error deactivating profile:', errorData);
        alert('Error deactivating profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deactivating profile:', error);
      alert('Error deactivating profile. Please check your connection and try again.');
    }
  };

  const handleReactivateProfile = async (profile: DeactivatedProfile) => {
    try {
      console.log('🔄 Reactivating profile:', profile.email);
      
      // Get the current user's access token for admin API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session found');
      }

      // Send reactivation request to server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/reactivate-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: profile.id.replace('deact_', ''),
          profileId: profile.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile reactivated successfully:', result);

        // Create reactivated profile for local state
        const reactivatedProfile = {
          id: profile.id.replace('deact_', ''),
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          age: profile.age,
          profession: profile.profession,
          joinedAt: profile.originalProfileData.joinedAt,
          lastActive: new Date().toISOString(),
          eventsAttended: profile.originalProfileData.eventsAttended,
          membershipStatus: 'Active',
          profileComplete: profile.originalProfileData.profileComplete,
          surveyComplete: profile.originalProfileData.surveyComplete
        };

        // Update local state
        setDeactivatedProfiles(prev => prev.filter(p => p.id !== profile.id));
        setActiveProfiles(prev => [reactivatedProfile, ...prev]);

        alert(`Profile for ${profile.name} has been reactivated successfully.`);
      } else {
        const errorData = await response.text();
        console.error('❌ Error reactivating profile:', errorData);
        alert('Error reactivating profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error reactivating profile:', error);
      alert('Error reactivating profile. Please check your connection and try again.');
    }
  };

  const filteredActiveProfiles = activeProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeactivatedProfiles = deactivatedProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active Premium': return 'bg-purple-100 text-purple-800';
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Deactivated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Profile Management</h2>
          <p className="text-gray-600">Manage active and deactivated member profiles</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProfiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProfiles.filter(p => p.membershipStatus.includes('Premium')).length} premium members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deactivated Profiles</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{deactivatedProfiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {deactivatedProfiles.filter(p => p.reason.includes('opt-out')).length} self-requested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProfiles.length + deactivatedProfiles.length}</div>
            <p className="text-xs text-muted-foreground">
              All-time registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search profiles by name, email, or profession..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Profile Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Profiles ({activeProfiles.length})</TabsTrigger>
          <TabsTrigger value="deactivated">Deactivated Profiles ({deactivatedProfiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Member Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Profession</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{profile.name}</div>
                          <div className="text-sm text-gray-500">{profile.age} years old</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{profile.email}</div>
                          <div className="text-sm text-gray-500">{profile.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{profile.profession}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(profile.membershipStatus)}>
                          {profile.membershipStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.eventsAttended}</TableCell>
                      <TableCell>
                        {new Date(profile.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Profile Details: {profile.name}</DialogTitle>
                                <DialogDescription>
                                  View comprehensive profile information and activity status.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Name</Label>
                                    <p className="text-sm">{profile.name}</p>
                                  </div>
                                  <div>
                                    <Label>Age</Label>
                                    <p className="text-sm">{profile.age}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm">{profile.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm">{profile.phone}</p>
                                  </div>
                                  <div>
                                    <Label>Profession</Label>
                                    <p className="text-sm">{profile.profession}</p>
                                  </div>
                                  <div>
                                    <Label>Events Attended</Label>
                                    <p className="text-sm">{profile.eventsAttended}</p>
                                  </div>
                                  <div>
                                    <Label>Profile Complete</Label>
                                    <p className="text-sm">{profile.profileComplete ? 'Yes' : 'No'}</p>
                                  </div>
                                  <div>
                                    <Label>Survey Complete</Label>
                                    <p className="text-sm">{profile.surveyComplete ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedProfile(profile);
                              setShowDeactivateDialog(true);
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deactivated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deactivated Member Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Profession</TableHead>
                    <TableHead>Deactivated</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeactivatedProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{profile.name}</div>
                          <div className="text-sm text-gray-500">{profile.age} years old</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{profile.email}</div>
                          <div className="text-sm text-gray-500">{profile.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{profile.profession}</TableCell>
                      <TableCell>
                        {new Date(profile.deactivatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={profile.reason}>
                          {profile.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateProfile(profile)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deactivation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Profile</DialogTitle>
            <DialogDescription>
              Deactivate this profile and send an automated notification to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProfile && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are about to deactivate the profile for <strong>{selectedProfile.name}</strong> ({selectedProfile.email}).
                  This action will remove them from active member lists and stop all email communications.
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="reason">Reason for Deactivation</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for deactivating this profile..."
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivateProfile}
                disabled={!deactivationReason.trim()}
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}