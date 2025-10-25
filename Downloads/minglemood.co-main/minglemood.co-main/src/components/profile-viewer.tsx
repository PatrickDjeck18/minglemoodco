import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  User, 
  Calendar, 
  MapPin, 
  Heart, 
  Music, 
  Coffee, 
  Briefcase, 
  GraduationCap, 
  Camera,
  Eye,
  MessageCircle,
  Star,
  Clock,
  Globe,
  Link
} from 'lucide-react';

interface ProfileViewerProps {
  user: any;
  trigger?: React.ReactNode;
}

export function ProfileViewer({ user, trigger }: ProfileViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const profileData = user.user_metadata?.profile_data || {};
  const surveyData = user.user_metadata?.survey_data || {};
  
  const joinDate = new Date(user.created_at || user.joinDate);
  const daysAgo = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 3600 * 24));

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
      <Eye className="h-3 w-3 mr-1" />
      View Profile
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="relative">
              {profileData.photos?.[0] ? (
                <img 
                  src={profileData.photos[0]} 
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#BF94EA]"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center text-white font-medium">
                  {profileData.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              {daysAgo <= 1 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">NEW</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profileData.name || 'Profile Incomplete'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={user.user_metadata?.profile_complete ? 'default' : 'secondary'}>
                  {user.user_metadata?.profile_complete ? '✅ Complete' : '⏳ Incomplete'}
                </Badge>
                {daysAgo <= 1 && (
                  <Badge className="bg-red-100 text-red-700">
                    {daysAgo === 0 ? 'Joined Today' : 'Joined Yesterday'}
                  </Badge>
                )}
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            View detailed profile information, photos, preferences, and system data for this member.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="preferences">Survey Results</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">{profileData.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-gray-900">{profileData.age || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-gray-900">{profileData.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Looking For</label>
                    <p className="text-gray-900">{profileData.lookingFor || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Location & Professional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location & Professional</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{profileData.location || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Occupation</label>
                    <p className="text-gray-900">{profileData.profession || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Education</label>
                    <p className="text-gray-900">{profileData.education || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cultural & Background */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Cultural Background</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Religion</label>
                    <p className="text-gray-900">{profileData.religion || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ethnicity</label>
                    <p className="text-gray-900">{profileData.ethnicity || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Link className="h-4 w-4" />
                    <span>Social Media</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">LinkedIn</label>
                    <p className="text-gray-900">{profileData.socialMedia?.linkedin || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Instagram</label>
                    <p className="text-gray-900">{profileData.socialMedia?.instagram || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Twitter/X</label>
                    <p className="text-gray-900">{profileData.socialMedia?.twitter || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bio */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Bio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {profileData.bio || 'No bio provided'}
                  </p>
                </CardContent>
              </Card>

              {/* Interests */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Interests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests?.length > 0 ? (
                      profileData.interests.map((interest: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-[#BF94EA]/10 text-[#BF94EA]">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No interests provided</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dating Preferences */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Dating Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Age Range Preference</label>
                      <p className="text-gray-900">
                        {profileData.ageRange ? 
                          `${profileData.ageRange.min} - ${profileData.ageRange.max} years` : 
                          'Not specified'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Max Distance</label>
                      <p className="text-gray-900">{profileData.maxDistance || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Preferred Age Ranges</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData.preferredAgeRanges?.length > 0 ? (
                          profileData.preferredAgeRanges.map((range: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {range}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Not specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Preferred Ethnicities</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData.preferredEthnicities?.length > 0 ? (
                          profileData.preferredEthnicities.map((ethnicity: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ethnicity}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Not specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Preferred Religions</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData.preferredReligions?.length > 0 ? (
                          profileData.preferredReligions.map((religion: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {religion}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Importance Ratings */}
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-3 block">Importance Ratings</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(profileData.importanceRatings || {}).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-xs text-gray-500 capitalize mb-1">{key}</div>
                          <Badge 
                            variant={value ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {value || 'Not rated'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Photo Gallery ({profileData.photos?.length || 0} photos)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.photos?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profileData.photos.map((photo: string, index: number) => (
                      <div key={index} className="relative">
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/50 text-white">
                            Photo {index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No photos uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            {user.user_metadata?.survey_completed ? (
              <div className="space-y-6">
                {/* Personality Traits - Self */}
                {surveyData.personalityTraitsSelf && Object.keys(surveyData.personalityTraitsSelf).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-[#BF94EA] rounded-full"></div>
                        <span>Their Personality Traits</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(surveyData.personalityTraitsSelf).map(([traitKey, choice]) => {
                          const personalityTraits = [
                            { key: 'energy', option1: 'Highly Energetic', option2: 'Calm/Relaxed' },
                            { key: 'communication', option1: 'Straightforward/Brutally Honest', option2: 'Peacekeeper/Avoids Conflict' },
                            { key: 'mindset', option1: 'Open-minded/Flexible', option2: 'Opinionated/Strong Perspectives' },
                            { key: 'listening', option1: 'Better Talker than Listener', option2: 'Better Listener than Talker' },
                            { key: 'leadership', option1: 'Leader/Take Charge', option2: 'Go with the Flow/Easygoing' },
                            { key: 'social', option1: 'Extroverted/Life of the Party', option2: 'Introverted/Cool/Reserved' },
                            { key: 'independence', option1: 'Does Better in Community with Others', option2: 'Does Better When Independent' },
                            { key: 'spontaneity', option1: 'Adventurous/Spontaneous', option2: 'Planner/Structured' },
                            { key: 'career', option1: 'Working Up the Ladder in Career', option2: 'Content Where They Are Career-wise' },
                            { key: 'intimacy', option1: 'Values Physical Self-expression', option2: 'Values Chastity' },
                            { key: 'lifestyle', option1: 'Enjoys Luxury and Finer Things', option2: 'Simple Low Maintenance Lifestyle' },
                            { key: 'friendship', option1: 'Has Lots of Close Friends', option2: 'More Selective with Inner Circle' },
                            { key: 'expression', option1: 'Expressive/Wears Heart on Sleeve', option2: 'Private/Reserved with Emotions' },
                            { key: 'playfulness', option1: 'Playful/Fun Loving', option2: 'Thoughtful/Reflective' },
                            { key: 'evenings', option1: 'Night on the Town', option2: 'Cozy Nights In' }
                          ];
                          
                          const trait = personalityTraits.find(t => t.key === traitKey);
                          if (!trait) return null;
                          
                          const selectedOption = choice === 'option1' ? trait.option1 : 
                                               choice === 'option2' ? trait.option2 : choice;
                          
                          return (
                            <div key={traitKey} className="border rounded-lg p-3 bg-[#BF94EA]/5">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">
                                    {trait.option1} vs. {trait.option2}
                                  </div>
                                  <Badge className="bg-[#BF94EA] text-white">
                                    {selectedOption}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Personality Traits - Partner Preferences */}
                {surveyData.personalityTraitsPartner && Object.keys(surveyData.personalityTraitsPartner).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-[#FA7872] rounded-full"></div>
                        <span>Partner Personality Preferences</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(surveyData.personalityTraitsPartner).map(([traitKey, choice]) => {
                          const personalityTraits = [
                            { key: 'energy', option1: 'Highly Energetic', option2: 'Calm/Relaxed' },
                            { key: 'communication', option1: 'Straightforward/Brutally Honest', option2: 'Peacekeeper/Avoids Conflict' },
                            { key: 'mindset', option1: 'Open-minded/Flexible', option2: 'Opinionated/Strong Perspectives' },
                            { key: 'listening', option1: 'Better Talker than Listener', option2: 'Better Listener than Talker' },
                            { key: 'leadership', option1: 'Leader/Take Charge', option2: 'Go with the Flow/Easygoing' },
                            { key: 'social', option1: 'Extroverted/Life of the Party', option2: 'Introverted/Cool/Reserved' },
                            { key: 'independence', option1: 'Does Better in Community with Others', option2: 'Does Better When Independent' },
                            { key: 'spontaneity', option1: 'Adventurous/Spontaneous', option2: 'Planner/Structured' },
                            { key: 'career', option1: 'Working Up the Ladder in Career', option2: 'Content Where They Are Career-wise' },
                            { key: 'intimacy', option1: 'Values Physical Self-expression', option2: 'Values Chastity' },
                            { key: 'lifestyle', option1: 'Enjoys Luxury and Finer Things', option2: 'Simple Low Maintenance Lifestyle' },
                            { key: 'friendship', option1: 'Has Lots of Close Friends', option2: 'More Selective with Inner Circle' },
                            { key: 'expression', option1: 'Expressive/Wears Heart on Sleeve', option2: 'Private/Reserved with Emotions' },
                            { key: 'playfulness', option1: 'Playful/Fun Loving', option2: 'Thoughtful/Reflective' },
                            { key: 'evenings', option1: 'Night on the Town', option2: 'Cozy Nights In' }
                          ];
                          
                          const trait = personalityTraits.find(t => t.key === traitKey);
                          if (!trait) return null;
                          
                          const selectedOption = choice === 'option1' ? trait.option1 : 
                                               choice === 'option2' ? trait.option2 : choice;
                          
                          return (
                            <div key={traitKey} className="border rounded-lg p-3 bg-[#FA7872]/5">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">
                                    {trait.option1} vs. {trait.option2}
                                  </div>
                                  <Badge className="bg-[#FA7872] text-white">
                                    {selectedOption}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Descriptors */}
                {surveyData.additionalDescriptors && surveyData.additionalDescriptors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Heart className="h-4 w-4" />
                        <span>Additional Descriptors</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Words/phrases that describe them:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {surveyData.additionalDescriptors.map((descriptor: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-sm">
                                {descriptor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Partner Descriptor Importance Ratings */}
                        {surveyData.partnerDescriptorImportance && Object.keys(surveyData.partnerDescriptorImportance).length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              Importance ratings for partner (1-5 scale):
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Object.entries(surveyData.partnerDescriptorImportance).map(([descriptor, rating]) => (
                                <div key={descriptor} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm truncate flex-1 mr-2">{descriptor}</span>
                                  <Badge className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] text-white">
                                    {rating}/5
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Other Survey Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-4 w-4" />
                      <span>Other Survey Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(surveyData).map(([key, value]) => {
                        // Skip the personality traits and descriptors as they're shown above
                        if (key === 'personalityTraitsSelf' || 
                            key === 'personalityTraitsPartner' || 
                            key === 'additionalDescriptors' ||
                            key === 'partnerDescriptorImportance') {
                          return null;
                        }
                        
                        return (
                          <div key={key} className="border rounded-lg p-3">
                            <label className="text-sm font-medium text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                            <p className="text-gray-900 mt-1">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ✅ Survey completed on {new Date(user.user_metadata?.survey_completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Preferences Survey Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Survey not completed yet</p>
                    <p className="text-sm text-gray-400 mt-1">User will receive survey invitation email</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">User ID</label>
                    <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email Confirmed</label>
                    <p className="text-gray-900">{user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Join Date</label>
                    <p className="text-gray-900">
                      {joinDate.toLocaleDateString()} at {joinDate.toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Profile Status</label>
                    <p className="text-gray-900">
                      {user.user_metadata?.profile_complete ? '✅ Complete' : '⏳ Incomplete'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Survey Status</label>
                    <p className="text-gray-900">
                      {user.user_metadata?.survey_completed ? '✅ Completed' : '⏳ Pending'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subscription Plan</label>
                    <p className="text-gray-900 capitalize">
                      {user.user_metadata?.subscription_plan || 'Basic'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Sign In</label>
                    <p className="text-gray-900">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Raw Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Raw User Metadata (Developer View)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(user.user_metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-500">
            Profile created {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}
          </div>
          <Button onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}