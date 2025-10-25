import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MapPin, Calendar, Users, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import mingleMoodLogo from 'figma:asset/9af07f423787b5c8c8233499c9eb1dc7f9de3eea.png';

interface PreferencesSurveyProps {
  user?: any;
  onComplete?: (surveyData: any) => void;
  onCancel?: () => void;
}

export function PreferencesSurvey({ user, onComplete, onCancel }: PreferencesSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState({
    // Logistics
    zipCode: '',
    availability: '',
    travelDistance: '',
    eventSize: '',
    eventType: [],
    
    // More about you
    hobbies: [],
    otherHobby: '',
    politicalLeanings: '',
    languages: '',
    smokingCigarettes: '',
    smoking420: '',
    drinking: '',
    education: '',
    homeowner: '',
    salaryRange: '',
    astrologicalSign: '',
    violentCrime: '',
    childrenStatus: '',
    wantChildren: '',
    openToPartnersWithChildren: '',
    healthChallenges: '',
    
    // Personality traits (self and partner preferences)
    personalityTraitsSelf: {},
    personalityTraitsPartner: {},
    
    // Additional descriptors
    additionalDescriptors: [],
    partnerDescriptorImportance: {},
    
    // Deal breakers
    dealBreakers: [],
    
    // Dating preferences
    newPeoplePerMonth: '',
    lookingFor: '',
    longestRelationship: '',
    avoidMatching: ''
  });

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateSurveyData = (field: string, value: any) => {
    setSurveyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (onComplete) {
      onComplete(surveyData);
    }
  };

  const personalityTraits = [
    { 
      key: 'energy', 
      option1: 'Highly Energetic', 
      option2: 'Calm/Relaxed' 
    },
    { 
      key: 'communication', 
      option1: 'Straightforward/Brutally Honest', 
      option2: 'Peacekeeper/Avoids Conflict' 
    },
    { 
      key: 'mindset', 
      option1: 'Open-minded/Flexible', 
      option2: 'Opinionated/Strong Perspectives' 
    },
    { 
      key: 'listening', 
      option1: 'Better Talker than Listener', 
      option2: 'Better Listener than Talker' 
    },
    { 
      key: 'leadership', 
      option1: 'Leader/Take Charge', 
      option2: 'Go with the Flow/Easygoing' 
    },
    { 
      key: 'social', 
      option1: 'Extroverted/Life of the Party', 
      option2: 'Introverted/Cool/Reserved' 
    },
    { 
      key: 'independence', 
      option1: 'Does Better in Community with Others', 
      option2: 'Does Better When Independent' 
    },
    { 
      key: 'spontaneity', 
      option1: 'Adventurous/Spontaneous', 
      option2: 'Planner/Structured' 
    },
    { 
      key: 'career', 
      option1: 'Working Up the Ladder in Career', 
      option2: 'Content Where They Are Career-wise' 
    },
    { 
      key: 'intimacy', 
      option1: 'Values Physical Self-expression', 
      option2: 'Values Chastity' 
    },
    { 
      key: 'lifestyle', 
      option1: 'Enjoys Luxury and Finer Things', 
      option2: 'Simple Low Maintenance Lifestyle' 
    },
    { 
      key: 'friendship', 
      option1: 'Has Lots of Close Friends', 
      option2: 'More Selective with Inner Circle' 
    },
    { 
      key: 'expression', 
      option1: 'Expressive/Wears Heart on Sleeve', 
      option2: 'Private/Reserved with Emotions' 
    },
    { 
      key: 'playfulness', 
      option1: 'Playful/Fun Loving', 
      option2: 'Thoughtful/Reflective' 
    },
    { 
      key: 'evenings', 
      option1: 'Night on the Town', 
      option2: 'Cozy Nights In' 
    }
  ];

  const additionalDescriptors = [
    'Excellent communicator', 'Generous', 'Honest', 'Supportive', 
    'Spontaneous', 'Independent', 'Emotionally sensitive', 'Romantic', 'Affectionate', 
    'Reliable', 'Family oriented', 'Spiritual or faith-based', 
    'Passionate', 'Ambitious', 'Straightforward', 'Politically aware/socially engaged', 'Responsible', 
    'Playful', 'Analytical', 'Physically active', 
    'Lighthearted/easy to laugh', 'Cultured - enjoys art, travel, food, and new experiences', 
    'Vegan/Vegetarian', 
    'Wants marriage', "Doesn't want marriage", 'Sobriety', 'Self Aware', 'Holistic Lifestyle'
  ];

  const dealBreakerOptions = [
    'Has kids', "Doesn't want kids", 'Smokes', 'Drinks', "Doesn't drink", '420', 'Non-monogamous', 
    'Lives more than 30 miles away', 'Very talkative/extroverted', 'Not talkative/introverted', 
    'Democrat', 'Republican', 'Politically neutral/unaware', 'Religious', 'Atheist', 'Divorced', 
    'Serious relationship only', 'Casual relationship only', 'Recreational drugs', 'Frugal', 
    'Education level', 'Not physically active', 'Height', 'Pet owner', 'Age'
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-r from-[#BF94EA]/10 to-[#FA7872]/10 rounded-lg border border-[#BF94EA]/20">
              <Heart className="h-12 w-12 text-[#BF94EA] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#01180B] mb-2">
                There's a peg for every hole - no right or wrong answers!
              </h3>
              <p className="text-gray-600">
                Please answer truthfully. There's someone out there who's going to love you!
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-[#01180B] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#BF94EA]" />
                Logistics
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">What is your zip code?</Label>
                  <Input
                    id="zipCode"
                    value={surveyData.zipCode}
                    onChange={(e) => updateSurveyData('zipCode', e.target.value)}
                    placeholder="Enter zip code"
                  />
                </div>
                
                <div>
                  <Label htmlFor="availability">When are you generally available?</Label>
                  <Select value={surveyData.availability} onValueChange={(value) => updateSurveyData('availability', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weeknights">Weeknights</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="travelDistance">How far are you willing to travel for an event?</Label>
                  <Select value={surveyData.travelDistance} onValueChange={(value) => updateSurveyData('travelDistance', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-miles">Within 5 miles</SelectItem>
                      <SelectItem value="10-miles">Within 10 miles</SelectItem>
                      <SelectItem value="20-miles">Within 20 miles</SelectItem>
                      <SelectItem value="30-miles">Within 30 miles</SelectItem>
                      <SelectItem value="50-miles">Within 50 miles</SelectItem>
                      <SelectItem value="anywhere">Anywhere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="eventSize">Do you prefer smaller, intimate dinners or larger social gatherings?</Label>
                  <Select value={surveyData.eventSize} onValueChange={(value) => updateSurveyData('eventSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intimate">Smaller, intimate dinners</SelectItem>
                      <SelectItem value="large">Larger social gatherings</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="eventType">What is your favorite type of events? (Choose up to 3)</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {['Wine & Food', 'Art & Culture', 'Outdoors & Adventure', 'Music & Nightlife', 'Wellness, Fitness and Sports', 'Workshops, Classes and Lectures', 'Philanthropy and Volunteering', 'Travel and Getaways', 'Games and Indoor Activities'].map((eventType) => (
                    <div key={eventType} className="flex items-center space-x-2">
                      <Checkbox
                        id={eventType}
                        checked={surveyData.eventType?.includes(eventType) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = surveyData.eventType || [];
                          if (checked && currentTypes.length < 3) {
                            updateSurveyData('eventType', [...currentTypes, eventType]);
                          } else if (!checked) {
                            updateSurveyData('eventType', currentTypes.filter(t => t !== eventType));
                          }
                        }}
                        disabled={!surveyData.eventType?.includes(eventType) && (surveyData.eventType?.length >= 3)}
                      />
                      <Label htmlFor={eventType} className="text-sm">{eventType}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {surveyData.eventType?.length || 0}/3
                </p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-[#01180B] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#BF94EA]" />
              More About You
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="hobbies">Three hobbies, interests or passions that you love talking about:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['Writing', 'Dance', 'Music', 'Film', 'Spirituality', 'Politics', 'Watching sports', 'Yoga', 'Journaling', 'Church', 'Coaching', 'Support groups', 'Reflecting in nature', 'Outdoor sports/activities', 'Playing sports', 'Travel'].map((hobby) => (
                    <div key={hobby} className="flex items-center space-x-2">
                      <Checkbox
                        id={hobby}
                        checked={surveyData.hobbies.includes(hobby)}
                        onCheckedChange={(checked) => {
                          if (checked && surveyData.hobbies.length < 3) {
                            updateSurveyData('hobbies', [...surveyData.hobbies, hobby]);
                          } else if (!checked) {
                            updateSurveyData('hobbies', surveyData.hobbies.filter(h => h !== hobby));
                          }
                        }}
                        disabled={!surveyData.hobbies.includes(hobby) && surveyData.hobbies.length >= 3}
                      />
                      <Label htmlFor={hobby} className="text-sm">{hobby}</Label>
                    </div>
                  ))}
                </div>
                
                {/* Other - Write in option */}
                <div className="mt-4">
                  <Label htmlFor="otherHobby" className="text-sm">Other (please specify):</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      id="otherHobby"
                      placeholder="Write your hobby/interest here..."
                      value={surveyData.otherHobby || ''}
                      onChange={(e) => updateSurveyData('otherHobby', e.target.value)}
                      disabled={surveyData.hobbies.length >= 3 && !surveyData.hobbies.includes('Other: ' + (surveyData.otherHobby || ''))}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (surveyData.otherHobby && surveyData.otherHobby.trim() && surveyData.hobbies.length < 3) {
                          const otherEntry = 'Other: ' + surveyData.otherHobby.trim();
                          if (!surveyData.hobbies.includes(otherEntry)) {
                            updateSurveyData('hobbies', [...surveyData.hobbies, otherEntry]);
                            updateSurveyData('otherHobby', '');
                          }
                        }
                      }}
                      disabled={!surveyData.otherHobby?.trim() || surveyData.hobbies.length >= 3}
                      className="bg-[#BF94EA] hover:bg-[#BF94EA]/90 text-white"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {surveyData.hobbies.length}/3
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="politicalLeanings">Political leanings:</Label>
                  <Select value={surveyData.politicalLeanings} onValueChange={(value) => updateSurveyData('politicalLeanings', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select political leaning" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="liberal">Liberal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="languages">Do you speak another language?</Label>
                  <Input
                    id="languages"
                    value={surveyData.languages}
                    onChange={(e) => updateSurveyData('languages', e.target.value)}
                    placeholder="Languages you speak"
                  />
                </div>
                
                <div>
                  <Label htmlFor="smokingCigarettes">Cigarettes:</Label>
                  <Select value={surveyData.smokingCigarettes} onValueChange={(value) => updateSurveyData('smokingCigarettes', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="socially">Socially/Occasionally</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="smoking420">420:</Label>
                  <Select value={surveyData.smoking420} onValueChange={(value) => updateSurveyData('smoking420', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="socially">Socially/Occasionally</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="drinking">Do you drink?</Label>
                  <Select value={surveyData.drinking} onValueChange={(value) => updateSurveyData('drinking', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="rarely">Rarely</SelectItem>
                      <SelectItem value="socially">Socially</SelectItem>
                      <SelectItem value="regularly">Regularly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="education">Highest level of education:</Label>
                  <Select value={surveyData.education} onValueChange={(value) => updateSurveyData('education', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="some-college">Some College</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-[#01180B]">More About You (Continued)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="homeowner">Are you a homeowner?</Label>
                <Select value={surveyData.homeowner} onValueChange={(value) => updateSurveyData('homeowner', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="salaryRange">Salary range:</Label>
                <Select value={surveyData.salaryRange} onValueChange={(value) => updateSurveyData('salaryRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-50k">Under $50k</SelectItem>
                    <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                    <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                    <SelectItem value="150k-200k">$150k - $200k</SelectItem>
                    <SelectItem value="over-200k">Over $200k</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="astrologicalSign">Astrological Sign:</Label>
                <Select value={surveyData.astrologicalSign} onValueChange={(value) => updateSurveyData('astrologicalSign', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aries">Aries</SelectItem>
                    <SelectItem value="taurus">Taurus</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="cancer">Cancer</SelectItem>
                    <SelectItem value="leo">Leo</SelectItem>
                    <SelectItem value="virgo">Virgo</SelectItem>
                    <SelectItem value="libra">Libra</SelectItem>
                    <SelectItem value="scorpio">Scorpio</SelectItem>
                    <SelectItem value="sagittarius">Sagittarius</SelectItem>
                    <SelectItem value="capricorn">Capricorn</SelectItem>
                    <SelectItem value="aquarius">Aquarius</SelectItem>
                    <SelectItem value="pisces">Pisces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="violentCrime">Have you ever been convicted of a violent crime?</Label>
                <Select value={surveyData.violentCrime} onValueChange={(value) => updateSurveyData('violentCrime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="childrenStatus">Do you have children?</Label>
                <Select value={surveyData.childrenStatus} onValueChange={(value) => updateSurveyData('childrenStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="wantChildren">Do you want more children?</Label>
                <Select value={surveyData.wantChildren} onValueChange={(value) => updateSurveyData('wantChildren', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="unsure">Unsure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="openToPartnersWithChildren">Are you open to those who have children?</Label>
                <Select value={surveyData.openToPartnersWithChildren} onValueChange={(value) => updateSurveyData('openToPartnersWithChildren', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="depends">Depends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="healthChallenges">Is there any physical, mental, or emotional health challenges that we should be aware of?</Label>
                <Textarea
                  id="healthChallenges"
                  value={surveyData.healthChallenges}
                  onChange={(e) => updateSurveyData('healthChallenges', e.target.value)}
                  placeholder="Please share anything relevant (optional)"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-[#01180B] flex items-center gap-2">
              <Star className="h-5 w-5 text-[#BF94EA]" />
              Personality Traits
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              For each trait below, answer both questions about yourself and your partner preferences.
            </p>
            
            <div className="space-y-8">
              {personalityTraits.map((trait) => (
                <div key={trait.key} className="border border-gray-200 rounded-lg p-6 bg-white">
                  <h5 className="font-semibold text-[#01180B] mb-4 text-lg">{trait.option1} vs. {trait.option2}</h5>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Self Assessment */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-[#BF94EA] rounded-full"></div>
                        <Label className="font-medium text-[#01180B]">Which feels more like you?</Label>
                      </div>
                      <RadioGroup
                        value={surveyData.personalityTraitsSelf[trait.key] || ''}
                        onValueChange={(value) => {
                          updateSurveyData('personalityTraitsSelf', {
                            ...surveyData.personalityTraitsSelf,
                            [trait.key]: value
                          });
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-[#BF94EA]/5 transition-colors">
                          <RadioGroupItem value="option1" id={`${trait.key}-self-option1`} />
                          <Label htmlFor={`${trait.key}-self-option1`} className="flex-1 cursor-pointer">
                            {trait.option1}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-[#BF94EA]/5 transition-colors">
                          <RadioGroupItem value="option2" id={`${trait.key}-self-option2`} />
                          <Label htmlFor={`${trait.key}-self-option2`} className="flex-1 cursor-pointer">
                            {trait.option2}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Partner Preference */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-[#FA7872] rounded-full"></div>
                        <Label className="font-medium text-[#01180B]">Which do you prefer in a partner?</Label>
                      </div>
                      <RadioGroup
                        value={surveyData.personalityTraitsPartner[trait.key] || ''}
                        onValueChange={(value) => {
                          updateSurveyData('personalityTraitsPartner', {
                            ...surveyData.personalityTraitsPartner,
                            [trait.key]: value
                          });
                        }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-[#FA7872]/5 transition-colors">
                          <RadioGroupItem value="option1" id={`${trait.key}-partner-option1`} />
                          <Label htmlFor={`${trait.key}-partner-option1`} className="flex-1 cursor-pointer">
                            {trait.option1}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-[#FA7872]/5 transition-colors">
                          <RadioGroupItem value="option2" id={`${trait.key}-partner-option2`} />
                          <Label htmlFor={`${trait.key}-partner-option2`} className="flex-1 cursor-pointer">
                            {trait.option2}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-[#FA7872]/5 transition-colors">
                          <RadioGroupItem value="either" id={`${trait.key}-partner-either`} />
                          <Label htmlFor={`${trait.key}-partner-either`} className="flex-1 cursor-pointer text-gray-700">
                            Either
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-[#FA7872]/5 transition-colors">
                          <RadioGroupItem value="complicated" id={`${trait.key}-partner-complicated`} />
                          <Label htmlFor={`${trait.key}-partner-complicated`} className="flex-1 cursor-pointer text-gray-700">
                            It's complicated
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-[#01180B]">Additional Descriptors</h4>
            <p className="text-sm text-gray-600">
              Choose up to 15 words/phrases that describe you, and rate how important each is for your partner.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {additionalDescriptors.map((descriptor) => (
                <div key={descriptor} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={descriptor}
                    checked={surveyData.additionalDescriptors.includes(descriptor)}
                    onCheckedChange={(checked) => {
                      if (checked && surveyData.additionalDescriptors.length < 15) {
                        updateSurveyData('additionalDescriptors', [...surveyData.additionalDescriptors, descriptor]);
                      } else if (!checked) {
                        updateSurveyData('additionalDescriptors', surveyData.additionalDescriptors.filter(d => d !== descriptor));
                      }
                    }}
                    disabled={!surveyData.additionalDescriptors.includes(descriptor) && surveyData.additionalDescriptors.length >= 15}
                  />
                  <Label htmlFor={descriptor} className="text-sm flex-1">{descriptor}</Label>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-4">
                Selected: {surveyData.additionalDescriptors.length}/15
              </p>
              
              {surveyData.additionalDescriptors.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-medium">Rate importance for your partner:</h5>
                  {surveyData.additionalDescriptors.map((descriptor) => (
                    <div key={descriptor} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{descriptor}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">1</span>
                        <Slider
                          value={[surveyData.partnerDescriptorImportance[descriptor] || 3]}
                          onValueChange={(value) => {
                            updateSurveyData('partnerDescriptorImportance', {
                              ...surveyData.partnerDescriptorImportance,
                              [descriptor]: value[0]
                            });
                          }}
                          max={5}
                          min={1}
                          step={1}
                          className="w-20"
                        />
                        <span className="text-xs">5</span>
                        <Badge variant="outline" className="w-8 text-center">
                          {surveyData.partnerDescriptorImportance[descriptor] || 3}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-[#01180B]">Deal Breakers & Dating Preferences</h4>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">What are your dealbreakers? (Pick up to 5)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dealBreakerOptions.map((dealBreaker) => (
                    <div key={dealBreaker} className="flex items-center space-x-2">
                      <Checkbox
                        id={dealBreaker}
                        checked={surveyData.dealBreakers.includes(dealBreaker)}
                        onCheckedChange={(checked) => {
                          if (checked && surveyData.dealBreakers.length < 8) {
                            updateSurveyData('dealBreakers', [...surveyData.dealBreakers, dealBreaker]);
                          } else if (!checked) {
                            updateSurveyData('dealBreakers', surveyData.dealBreakers.filter(d => d !== dealBreaker));
                          }
                        }}
                        disabled={!surveyData.dealBreakers.includes(dealBreaker) && surveyData.dealBreakers.length >= 8}
                      />
                      <Label htmlFor={dealBreaker} className="text-sm">{dealBreaker}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {surveyData.dealBreakers.length}/8
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPeoplePerMonth">How many new people would you ideally like to meet in a month?</Label>
                  <Input
                    id="newPeoplePerMonth"
                    value={surveyData.newPeoplePerMonth}
                    onChange={(e) => updateSurveyData('newPeoplePerMonth', e.target.value)}
                    placeholder="Enter number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lookingFor">What are you looking for right now?</Label>
                  <Select value={surveyData.lookingFor} onValueChange={(value) => updateSurveyData('lookingFor', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select what you're looking for" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serious">Serious relationship</SelectItem>
                      <SelectItem value="open">Open to possibilities</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="not-sure">Not sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="longestRelationship">Longest lasting relationship:</Label>
                  <Input
                    id="longestRelationship"
                    value={surveyData.longestRelationship}
                    onChange={(e) => updateSurveyData('longestRelationship', e.target.value)}
                    placeholder="e.g., 3 years"
                  />
                </div>
              </div>
              

              
              <div>
                <Label htmlFor="avoidMatching">Optional: Is there anything we should avoid when matching you? (ex: certain industries, past connections, etc.)</Label>
                <Textarea
                  id="avoidMatching"
                  value={surveyData.avoidMatching}
                  onChange={(e) => updateSurveyData('avoidMatching', e.target.value)}
                  placeholder="Anything specific to avoid..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="bg-gradient-to-br from-[#BF94EA] to-[#FA7872] rounded-lg p-3 w-16 h-16 flex items-center justify-center">
                <img 
                  src={mingleMoodLogo} 
                  alt="MingleMood" 
                  className="w-12 h-12 object-contain rounded-md"
                />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-[#BF94EA] to-[#FA7872] bg-clip-text text-transparent">
                  Preferences Survey
                </CardTitle>
                <p className="text-gray-600">Help us find your perfect match</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
          
          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex space-x-2">
              {onCancel && (
                <Button onClick={onCancel} variant="ghost">
                  Cancel
                </Button>
              )}
              
              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:from-[#BF94EA]/90 hover:to-[#FA7872]/90"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#CDEDB2] to-[#BF94EA] text-[#01180B] hover:from-[#CDEDB2]/90 hover:to-[#BF94EA]/90"
                >
                  <Heart className="h-4 w-4" />
                  <span>Complete Survey</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}