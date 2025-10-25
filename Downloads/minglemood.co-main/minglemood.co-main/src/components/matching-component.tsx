import React, { useState, useEffect } from 'react';
import { Heart, X, MessageCircle, MapPin, Users, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Match {
  id: string;
  name: string;
  age: number;
  location: string;
  profession: string;
  photos: string[];
  compatibilityScore: number;
  sharedInterests: string[];
  lastActive: string;
  mutualLike: boolean;
}

interface Conversation {
  id: string;
  matchId: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface MatchingComponentProps {
  user: any;
}

export function MatchingComponent({ user }: MatchingComponentProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    loadMatches();
    loadConversations();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/matches`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, using demo data:', error);
      // Generate sample matches as fallback
      const sampleMatches = generateSampleMatches();
      setMatches(sampleMatches);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/conversations`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, using demo data:', error);
      // Generate sample conversations as fallback
      const sampleConversations = generateSampleConversations();
      setConversations(sampleConversations);
    }
  };

  const generateSampleMatches = (): Match[] => {
    // Return empty array - no sample matches with stock photos
    // Real matches will be generated from actual user profiles
    return [];
  };

  const generateSampleConversations = (): Conversation[] => {
    return [
      {
        id: 'conv-1',
        matchId: 'match-1',
        lastMessage: 'That gallery opening sounds amazing! I\'d love to join you.',
        timestamp: '2 hours ago',
        unread: true
      },
      {
        id: 'conv-3',
        matchId: 'match-3',
        lastMessage: 'Thanks for the yoga class recommendation! 🧘‍♀️',
        timestamp: '1 day ago',
        unread: false
      }
    ];
  };

  const handleLike = async (matchId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          userId: user.id,
          likedUserId: matchId
        })
      });

      if (response.ok) {
        // Update match status
        setMatches(prev => prev.map(match => 
          match.id === matchId 
            ? { ...match, mutualLike: true }
            : match
        ));
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      console.log('Server not available, updating UI locally:', error);
      // Still update UI for demo purposes
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, mutualLike: true }
          : match
      ));
    }
  };

  const handlePass = (matchId: string) => {
    // Remove match from discover list
    setMatches(prev => prev.filter(match => match.id !== matchId));
  };

  const potentialMatches = matches.filter(match => !match.mutualLike);
  const mutualMatches = matches.filter(match => match.mutualLike);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Matches</h2>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-pink-600" />
          <span className="text-sm text-gray-600">{mutualMatches.length} mutual connections</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="matches">
            Matches ({mutualMatches.length})
          </TabsTrigger>
          <TabsTrigger value="conversations">
            Messages ({conversations.filter(c => c.unread).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {potentialMatches.length > 0 ? (
            <div className="grid gap-6">
              {potentialMatches.map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <ImageWithFallback
                          src={match.photos[0]}
                          alt={match.name}
                          className="w-full h-64 md:h-full object-cover"
                        />
                      </div>
                      
                      <div className="md:w-2/3 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{match.name}, {match.age}</h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {match.location}
                            </div>
                            <p className="text-gray-600">{match.profession}</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-2">
                              <Sparkles className="h-4 w-4 text-pink-600" />
                              <span className="text-pink-600 font-semibold">{match.compatibilityScore}% Match</span>
                            </div>
                            <div className="text-xs text-gray-500">{match.lastActive}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <span>Compatibility Score</span>
                          </div>
                          <Progress value={match.compatibilityScore} className="h-2" />
                        </div>

                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Interests</h4>
                          <div className="flex flex-wrap gap-2">
                            {match.sharedInterests.map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handlePass(match.id)}
                            className="flex-1 hover:bg-gray-50"
                          >
                            <X className="h-5 w-5 mr-2" />
                            Pass
                          </Button>
                          <Button
                            size="lg"
                            onClick={() => handleLike(match.id)}
                            className="flex-1 bg-pink-600 hover:bg-pink-700"
                          >
                            <Heart className="h-5 w-5 mr-2" />
                            Like
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No more potential matches</h3>
                <p className="text-gray-600">Check back later for new profiles that match your preferences!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          {mutualMatches.length > 0 ? (
            <div className="grid gap-4">
              {mutualMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <ImageWithFallback
                        src={match.photos[0]}
                        alt={match.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{match.name}, {match.age}</h3>
                        <p className="text-sm text-gray-600">{match.profession}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {match.location}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center text-pink-600 text-sm mb-2">
                          <Heart className="h-4 w-4 mr-1 fill-current" />
                          {match.compatibilityScore}% Match
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No mutual matches yet</h3>
                <p className="text-gray-600 mb-4">Keep swiping to find your perfect match!</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Profiles
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          {conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const match = matches.find(m => m.id === conversation.matchId);
                if (!match) return null;

                return (
                  <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <ImageWithFallback
                            src={match.photos[0]}
                            alt={match.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                          {conversation.unread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{match.name}</h3>
                            <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-4">Start chatting with your matches to break the ice!</p>
                <Button onClick={() => setActiveTab('matches')}>
                  View Matches
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}