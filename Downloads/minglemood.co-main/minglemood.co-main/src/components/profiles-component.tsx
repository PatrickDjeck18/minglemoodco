import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Briefcase, GraduationCap, Filter, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  profession: string;
  education: string;
  interests: string[];
  bio: string;
  photos: string[];
  verified: boolean;
  lastActive: string;
}

interface ProfilesComponentProps {
  user: any;
}

export function ProfilesComponent({ user }: ProfilesComponentProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, ageFilter, locationFilter]);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/profiles`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, using demo data:', error);
      // Generate sample profiles as fallback
      const sampleProfiles = generateSampleProfiles();
      setProfiles(sampleProfiles);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleProfiles = (): Profile[] => {
    const sampleData = [
      {
        name: 'Alexandra Chen',
        age: 28,
        location: 'San Francisco, CA',
        profession: 'Product Manager',
        education: 'Stanford MBA',
        interests: ['Yoga', 'Wine Tasting', 'Travel', 'Photography'],
        bio: 'Passionate about building products that make a difference. Love exploring new restaurants and weekend getaways to Napa.',
        verified: true,
        lastActive: '2 hours ago'
      },
      {
        name: 'Marcus Rodriguez',
        age: 32,
        location: 'New York, NY',
        profession: 'Investment Banker',
        education: 'Wharton MBA',
        interests: ['Tennis', 'Art Galleries', 'Cooking', 'Skiing'],
        bio: 'Finance by day, chef by night. Always looking for the next adventure and someone to share it with.',
        verified: true,
        lastActive: '1 day ago'
      },
      {
        name: 'Sofia Williams',
        age: 26,
        location: 'Los Angeles, CA',
        profession: 'Doctor',
        education: 'UCLA Medical',
        interests: ['Hiking', 'Reading', 'Pilates', 'Concerts'],
        bio: 'Emergency medicine physician who believes in work-life balance. Weekend warrior who loves live music.',
        verified: true,
        lastActive: '3 hours ago'
      },
      {
        name: 'James Thompson',
        age: 35,
        location: 'Chicago, IL',
        profession: 'Tech Entrepreneur',
        education: 'MIT Engineering',
        interests: ['Sailing', 'Jazz', 'Mentoring', 'Golf'],
        bio: 'Built and sold two startups. Now focusing on impact investing and finding someone special to share life with.',
        verified: true,
        lastActive: '5 hours ago'
      },
      {
        name: 'Emma Davis',
        age: 29,
        location: 'Miami, FL',
        profession: 'Creative Director',
        education: 'Parsons Design',
        interests: ['Fashion', 'Surfing', 'Meditation', 'Brunch'],
        bio: 'Creative soul with a passion for beautiful design and meaningful connections. Love the beach lifestyle.',
        verified: true,
        lastActive: '30 minutes ago'
      },
      {
        name: 'David Kim',
        age: 31,
        location: 'Seattle, WA',
        profession: 'Software Architect',
        education: 'Carnegie Mellon CS',
        interests: ['Rock Climbing', 'Coffee', 'Board Games', 'Hiking'],
        bio: 'Tech lead who loves solving complex problems. When not coding, you can find me on a mountain or trying new coffee shops.',
        verified: true,
        lastActive: '4 hours ago'
      }
    ];

    return sampleData.map((data, index) => ({
      id: `profile-${index + 1}`,
      ...data,
      photos: [] // No stock photos - user profiles only
    }));
  };

  const filterProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.interests.some(interest => 
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (ageFilter !== 'all') {
      const [min, max] = ageFilter.split('-').map(Number);
      filtered = filtered.filter(profile => {
        if (max) {
          return profile.age >= min && profile.age <= max;
        } else {
          return profile.age >= min;
        }
      });
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(profile =>
        profile.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredProfiles(filtered);
  };

  const handleLike = async (profileId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          userId: user.id,
          likedUserId: profileId
        })
      });

      if (response.ok) {
        setLikedProfiles(prev => new Set(prev).add(profileId));
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, updating UI locally:', error);
      // Still update UI for demo purposes
      setLikedProfiles(prev => new Set(prev).add(profileId));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-t-lg"></div>
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
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, profession, or interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Age Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="22-25">22-25</SelectItem>
                <SelectItem value="26-30">26-30</SelectItem>
                <SelectItem value="31-35">31-35</SelectItem>
                <SelectItem value="36-40">36-40</SelectItem>
                <SelectItem value="41">41+</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="san francisco">San Francisco</SelectItem>
                <SelectItem value="new york">New York</SelectItem>
                <SelectItem value="los angeles">Los Angeles</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="miami">Miami</SelectItem>
                <SelectItem value="seattle">Seattle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <ImageWithFallback
                src={profile.photos[0]}
                alt={profile.name}
                className="w-full h-64 object-cover"
              />
              {profile.verified && (
                <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                  Verified
                </Badge>
              )}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {profile.lastActive}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{profile.name}, {profile.age}</h3>
                <Button
                  size="sm"
                  variant={likedProfiles.has(profile.id) ? "default" : "outline"}
                  onClick={() => handleLike(profile.id)}
                  className={likedProfiles.has(profile.id) ? "bg-pink-500 hover:bg-pink-600" : ""}
                >
                  <Heart className={`h-4 w-4 ${likedProfiles.has(profile.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profile.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {profile.profession}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {profile.education}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{profile.bio}</p>

              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{profile.interests.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Filter className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No profiles found</h3>
              <p>Try adjusting your search criteria or filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}