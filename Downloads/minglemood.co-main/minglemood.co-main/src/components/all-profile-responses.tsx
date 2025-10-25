import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProfileViewer } from './profile-viewer';
import { 
  Users, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Heart,
  Camera,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

export function AllProfileResponses() {
  const [profileResponses, setProfileResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  useEffect(() => {
    loadProfileResponses();
  }, []);

  const loadProfileResponses = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token found');
        return;
      }

      console.log('🔍 Fetching all profile responses...');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/admin/profile-responses`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Profile responses loaded:', data.length);
      setProfileResponses(data);
    } catch (error) {
      // Silently handle error - backend may not be available
      setProfileResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = profileResponses.filter(user => {
    // Search filter
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile_data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile_data?.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    let matchesFilter = true;
    switch (filterBy) {
      case 'complete':
        matchesFilter = user.profile_complete && user.survey_completed;
        break;
      case 'profile_only':
        matchesFilter = user.profile_complete && !user.survey_completed;
        break;
      case 'survey_only':
        matchesFilter = user.survey_completed && !user.profile_complete;
        break;
      case 'incomplete':
        matchesFilter = !user.profile_complete || !user.survey_completed;
        break;
      case 'today':
        matchesFilter = user.days_since_signup === 0;
        break;
      case 'yesterday':
        matchesFilter = user.days_since_signup === 1;
        break;
      case 'this_week':
        matchesFilter = user.days_since_signup <= 7;
        break;
      default:
        matchesFilter = true;
    }

    // Date range filter
    if (selectedDateRange !== 'all') {
      const daysDiff = user.days_since_signup;
      switch (selectedDateRange) {
        case 'today':
          matchesFilter = matchesFilter && daysDiff === 0;
          break;
        case 'yesterday':
          matchesFilter = matchesFilter && daysDiff === 1;
          break;
        case 'week':
          matchesFilter = matchesFilter && daysDiff <= 7;
          break;
        case 'month':
          matchesFilter = matchesFilter && daysDiff <= 30;
          break;
      }
    }

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        const nameA = a.profile_data?.name || a.email;
        const nameB = b.profile_data?.name || b.email;
        return nameA.localeCompare(nameB);
      case 'complete_first':
        const scoreA = (a.profile_complete ? 2 : 0) + (a.survey_completed ? 1 : 0);
        const scoreB = (b.profile_complete ? 2 : 0) + (b.survey_completed ? 1 : 0);
        return scoreB - scoreA;
      default:
        return 0;
    }
  });

  const stats = {
    total: profileResponses.length,
    complete_profiles: profileResponses.filter(u => u.profile_complete).length,
    completed_surveys: profileResponses.filter(u => u.survey_completed).length,
    both_complete: profileResponses.filter(u => u.profile_complete && u.survey_completed).length,
    today: profileResponses.filter(u => u.days_since_signup === 0).length,
    yesterday: profileResponses.filter(u => u.days_since_signup === 1).length,
    this_week: profileResponses.filter(u => u.days_since_signup <= 7).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-[#BF94EA]" />
          <span>Loading all profile responses...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#01180B]">📋 All Profile Responses</h2>
          <p className="text-gray-600">Complete view of all user profile data and survey responses</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadProfileResponses}
            variant="outline"
            className="border-[#BF94EA] text-[#BF94EA] hover:bg-[#BF94EA]/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:from-[#BF94EA]/90 hover:to-[#FA7872]/90 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-800">{stats.complete_profiles}</div>
            <div className="text-sm text-green-600">Complete Profiles</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-800">{stats.completed_surveys}</div>
            <div className="text-sm text-purple-600">Surveys Done</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#BF94EA]/20 to-[#FA7872]/20">
          <CardContent className="p-4 text-center">
            <Heart className="h-6 w-6 text-[#BF94EA] mx-auto mb-2" />
            <div className="text-2xl font-bold text-[#01180B]">{stats.both_complete}</div>
            <div className="text-sm text-[#01180B]">Fully Complete</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-800">{stats.today}</div>
            <div className="text-sm text-red-600">Today</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-800">{stats.yesterday}</div>
            <div className="text-sm text-orange-600">Yesterday</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-teal-100">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-teal-800">{stats.this_week}</div>
            <div className="text-sm text-teal-600">This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by name, email, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Filter by Status</label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="complete">Fully Complete (Profile + Survey)</SelectItem>
                  <SelectItem value="profile_only">Profile Complete Only</SelectItem>
                  <SelectItem value="survey_only">Survey Complete Only</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="today">Signed up Today</SelectItem>
                  <SelectItem value="yesterday">Signed up Yesterday</SelectItem>
                  <SelectItem value="this_week">Signed up This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Date Range</label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Sort by</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="complete_first">Most Complete First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <strong>{filteredResponses.length}</strong> of <strong>{profileResponses.length}</strong> profile responses
        </p>
      </div>

      {/* Profile Responses Grid */}
      {filteredResponses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResponses.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  {user.profile_data?.photos?.[0] ? (
                    <img 
                      src={user.profile_data.photos[0]} 
                      alt="Profile"
                      className="h-14 w-14 rounded-full object-cover border-2 border-[#BF94EA]"
                    />
                  ) : (
                    <div className="h-14 w-14 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {user.profile_data?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {user.profile_data?.name || 'Profile Incomplete'}
                    </h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={user.profile_complete ? 'default' : 'secondary'} className="text-xs">
                        {user.profile_complete ? '✅ Profile' : '⏳ Profile'}
                      </Badge>
                      <Badge variant={user.survey_completed ? 'default' : 'secondary'} className="text-xs">
                        {user.survey_completed ? '✅ Survey' : '⏳ Survey'}
                      </Badge>
                      {user.days_since_signup <= 1 && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          {user.days_since_signup === 0 ? 'TODAY' : 'YESTERDAY'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <User className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Age</div>
                    <div className="font-medium">{user.profile_data?.age || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <Camera className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Photos</div>
                    <div className="font-medium">{user.profile_data?.photos?.length || 0}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <Heart className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Interests</div>
                    <div className="font-medium">{user.profile_data?.interests?.length || 0}</div>
                  </div>
                </div>

                {/* Key Info Preview */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Location:</span>
                    <span className="ml-2 text-gray-900">{user.profile_data?.location || 'Not provided'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Joined:</span>
                    <span className="ml-2 text-gray-900">
                      {user.days_since_signup === 0 ? 'Today' : 
                       user.days_since_signup === 1 ? 'Yesterday' : 
                       `${user.days_since_signup} days ago`}
                    </span>
                  </div>
                  {user.profile_data?.bio && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Bio:</span>
                      <p className="text-gray-900 mt-1 text-xs leading-relaxed line-clamp-2">
                        {user.profile_data.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Full Profile Button */}
                <ProfileViewer 
                  user={user} 
                  trigger={
                    <Button className="w-full bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:from-[#BF94EA]/90 hover:to-[#FA7872]/90 text-white">
                      📋 View Complete Response
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Profile Responses Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterBy !== 'all' ? 
                'No users match your current filters. Try adjusting your search or filter criteria.' :
                'No users have completed their profiles yet. Profile responses will appear here once users complete their profile setup.'
              }
            </p>
            {(searchTerm || filterBy !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                  setSelectedDateRange('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}