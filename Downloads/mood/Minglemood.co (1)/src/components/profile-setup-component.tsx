import React, { useState, useEffect } from 'react';
import { Camera, Upload, MapPin, Briefcase, GraduationCap, Heart, Plus, X, Check, Instagram, Linkedin, Twitter, Phone, Info } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfileSetupProps {
  user: any;
  onProfileComplete: (profileData: ProfileData) => void;
}

interface ProfileData {
  name: string;
  photos: string[];
  age: string;
  gender: string;
  location: string;
  phone: string;
  profession: string;
  education: string;
  religion: string;
  ethnicity: string;
  socialMedia: {
    linkedin: string;
    instagram: string;
    twitter: string;
  };
  bio: string;
  interests: string[];
  lookingFor: string;
  // Detailed Dating Preferences
  preferredAgeRanges: string[];
  ageFlexibility: string;
  preferredEthnicities: string[];
  ethnicityFlexibility: string;
  preferredReligions: string[];
  religionFlexibility: string;
  importanceRatings: {
    looks: string;
    career: string;
    age: string;
    ethnicity: string;
    religion: string;
    location: string;
  };
  // Basic Preferences
  ageRange: { min: string; max: string };
  maxDistance: string;
}

const availableInterests = [
  'Travel', 'Photography', 'Yoga', 'Wine Tasting', 'Hiking', 'Art Galleries', 
  'Cooking', 'Tennis', 'Skiing', 'Music', 'Dancing', 'Reading', 'Theater',
  'Fine Dining', 'Coffee', 'Fitness', 'Meditation', 'Fashion', 'Technology',
  'Entrepreneurship', 'Volunteering', 'Golf', 'Sailing', 'Cycling'
];

const cities = [
  'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
  'Miami, FL', 'Boston, MA', 'Seattle, WA', 'Austin, TX', 'Denver, CO',
  'Atlanta, GA', 'Washington, DC', 'San Diego, CA', 'Philadelphia, PA'
];

const religions = [
  'All religion preferences', 'Christianity', 'Judaism', 'Islam', 'Hinduism', 'Buddhism', 'Sikhism',
  'Atheist', 'Agnostic', 'Spiritual but not religious', 'Other', 'Prefer not to say'
];

const ethnicities = [
  'All races', 'Asian', 'Black or African American', 'Hispanic or Latino', 'White or Caucasian',
  'Native American or Alaska Native', 'Native Hawaiian or Pacific Islander',
  'Middle Eastern or North African', 'Mixed or Multiracial', 'Other', 'Prefer not to say'
];

const ageRangeOptions = [
  'All age ranges', '28-42', '43-48', '48-55', '56+'
];

const flexibilityOptions = [
  'Yes', 'No', 'Sure I\'ll try it'
];

const importanceOptions = [
  'Not important', 'Somewhat important', 'Important', 'Very important', 'Extremely important'
];

export function ProfileSetupComponent({ user, onProfileComplete }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    photos: [],
    age: '',
    gender: '',
    location: '',
    phone: '',
    profession: '',
    education: '',
    religion: '',
    ethnicity: '',
    socialMedia: {
      linkedin: '',
      instagram: '',
      twitter: ''
    },
    bio: '',
    interests: [],
    lookingFor: '',
    preferredAgeRanges: [],
    ageFlexibility: '',
    preferredEthnicities: [],
    ethnicityFlexibility: '',
    preferredReligions: [],
    religionFlexibility: '',
    importanceRatings: {
      looks: '',
      career: '',
      age: '',
      ethnicity: '',
      religion: '',
      location: ''
    },
    // Basic Preferences
    ageRange: { min: '25', max: '35' },
    maxDistance: '25'
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Check for mobile device and load existing profile data
  useEffect(() => {
    // Enhanced mobile detection
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
                       window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
      console.log('📱 Mobile device detected:', isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load existing profile data
    if (user?.user_metadata?.profile_data) {
      console.log('✅ Loading existing profile data');
      const existingData = user.user_metadata.profile_data;
      let cleanedPhotos: string[] = [];
      
      // Clean demo photos
      if (existingData.photos?.length > 0) {
        existingData.photos.forEach((photo: string) => {
          if (photo.startsWith('data:image/') || photo.startsWith('blob:') || photo.startsWith('http')) {
            cleanedPhotos.push(photo);
          }
        });
      }
      
      setProfileData({
        ...existingData,
        photos: cleanedPhotos,
        // Ensure socialMedia exists with defaults
        socialMedia: existingData.socialMedia || {
          linkedin: '',
          instagram: '',
          twitter: ''
        },
        // Ensure importanceRatings exists with defaults
        importanceRatings: existingData.importanceRatings || {
          looks: '',
          career: '',
          age: '',
          ethnicity: '',
          religion: '',
          location: ''
        },
        // Ensure other arrays exist
        interests: existingData.interests || [],
        preferredAgeRanges: existingData.preferredAgeRanges || [],
        preferredEthnicities: existingData.preferredEthnicities || [],
        preferredReligions: existingData.preferredReligions || [],
        // Ensure ageRange exists with defaults
        ageRange: existingData.ageRange || { min: '25', max: '45' }
      });
      
      if (user.user_metadata.signup_profile_complete && cleanedPhotos.length === 0) {
        setCurrentStep(1); // Photos step
      }
    } else if (user?.user_metadata?.signup_profile_complete) {
      const signupProfileData: ProfileData = {
        name: user.user_metadata.name || '',
        phone: user.user_metadata.phone || '',
        photos: [],
        age: '',
        gender: '',
        location: '',
        profession: '',
        education: '',
        religion: '',
        ethnicity: '',
        socialMedia: {
          linkedin: '',
          instagram: '',
          twitter: ''
        },
        bio: '',
        interests: [],
        lookingFor: '',
        preferredAgeRanges: [],
        ageFlexibility: '',
        preferredEthnicities: [],
        ethnicityFlexibility: '',
        preferredReligions: [],
        religionFlexibility: '',
        importanceRatings: {
          looks: '',
          career: '',
          age: '',
          ethnicity: '',
          religion: '',
          location: ''
        },
        ageRange: { min: '25', max: '45' },
        maxDistance: '25'
      };
      
      setProfileData(signupProfileData);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [user]);

  // Photo upload - Gallery/Camera Roll ONLY (NO camera capture)
  const handlePhotoUpload = (source?: 'gallery') => {
    console.log('📸 Photo upload requested from gallery/camera roll');
    console.log('📱 Is mobile device:', isMobileDevice);
    
    // Create file input for photo gallery/camera roll ONLY
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.multiple = false; // Single file only
    
    // CRITICAL: Explicitly ensure NO capture attribute exists
    // The capture attribute would force camera to open immediately on mobile
    // We want photo library/camera roll selection ONLY
    if (input.hasAttribute('capture')) {
      input.removeAttribute('capture');
    }
    
    console.log('🖼️ Gallery mode: Photo library/camera roll only, NO direct camera capture');
    
    document.body.appendChild(input);
    
    input.onchange = (event) => {
      console.log('📸 File selected from source:', source || 'default');
      handleFileSelection(event);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.oncancel = () => {
      console.log('❌ File selection cancelled for source:', source || 'default');
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    // Add a small delay to ensure DOM is ready, then trigger
    setTimeout(() => {
      try {
        input.click();
        console.log('✅ File picker opened for source:', source || 'default');
      } catch (error) {
        console.error('❌ Failed to open photo gallery:', error);
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
        
        // Show error message for photo gallery/camera roll access
        alert('🖼️ Photo gallery access failed. Try:\n\n1. Allow photo library permissions when prompted\n2. Refresh the page and try again\n3. Check your browser settings for photo access');
      }
    }, 100);
  };

  const handleFileSelection = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    
    console.log('📸 File selected:', file ? file.name : 'No file');
    console.log('📊 Current photos count:', profileData.photos.length);
    
    if (file && profileData.photos.length < 6) {
      // Enhanced mobile-friendly validation
      const maxSize = 10 * 1024 * 1024; // 10MB file size limit
      if (file.size > maxSize) {
        alert('Photo must be less than 10MB. Please choose a smaller image from your photo gallery.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('🚫 Invalid file type:', file.type);
        alert('📸 Please select an image file from your photo gallery.');
        return;
      }
      
      
      setUploadingPhoto(true);
      console.log('🔄 Starting photo processing...');
      
      const reader = new FileReader();
      
      // Set a timeout for the file reading process (30 seconds for mobile)
      const timeoutId = setTimeout(() => {
        console.error('❌ Photo processing timeout after 30 seconds');
        alert('Photo upload is taking too long. Please try:\n\n1. Select a smaller image\n2. Check your internet connection\n3. Try again with a different photo');
        setUploadingPhoto(false);
      }, 30000);
      
      reader.onload = (e) => {
        clearTimeout(timeoutId);
        const result = e.target?.result as string;
        console.log('✅ Photo processed successfully, data URL length:', result.length);
        
        setProfileData(prev => {
          const newPhotos = [...prev.photos, result];
          console.log('📊 Updated photos count:', newPhotos.length);
          return {
            ...prev,
            photos: newPhotos
          };
        });
        setUploadingPhoto(false);
        console.log('✅ Photo upload complete');
      };
      
      reader.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ FileReader error');
        alert('Error reading the photo file. Please try again or select a different image.');
        setUploadingPhoto(false);
      };
      
      // Enhanced error handling for mobile
      try {
        reader.readAsDataURL(file);
        console.log('🔄 FileReader started successfully');
      } catch (error) {
        console.error('❌ Failed to start FileReader:', error);
        clearTimeout(timeoutId);
        alert('Error starting photo upload. Please try again.');
        setUploadingPhoto(false);
      }
    } else if (profileData.photos.length >= 6) {
      alert('You can upload a maximum of 6 photos. Remove a photo first by tapping the X button on any existing photo.');
    } else if (!file) {
      console.log('📸 No file selected');
    }
    
    // Reset the input value so the same file can be selected again
    (event.target as HTMLInputElement).value = '';
  };

  const removePhoto = (index: number) => {
    console.log('🗑️ Removing photo at index:', index);
    
    setProfileData(prev => {
      const newPhotos = prev.photos.filter((_, i) => i !== index);
      console.log('📊 Photos after removal:', newPhotos.length);
      return {
        ...prev,
        photos: newPhotos
      };
    });
  };

  const toggleInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const togglePreferredEthnicity = (ethnicity: string) => {
    setProfileData(prev => {
      const current = prev.preferredEthnicities;
      if (current.includes(ethnicity)) {
        return {
          ...prev,
          preferredEthnicities: current.filter(e => e !== ethnicity)
        };
      } else if (current.length < 5) {
        return {
          ...prev,
          preferredEthnicities: [...current, ethnicity]
        };
      }
      return prev; // Don't add if already at limit of 5
    });
  };

  const togglePreferredReligion = (religion: string) => {
    setProfileData(prev => {
      const current = prev.preferredReligions;
      if (current.includes(religion)) {
        return {
          ...prev,
          preferredReligions: current.filter(r => r !== religion)
        };
      } else if (current.length < 5) {
        return {
          ...prev,
          preferredReligions: [...current, religion]
        };
      }
      return prev; // Don't add if already at limit of 5
    });
  };

  const togglePreferredAgeRange = (ageRange: string) => {
    setProfileData(prev => {
      const current = prev.preferredAgeRanges;
      if (current.includes(ageRange)) {
        return {
          ...prev,
          preferredAgeRanges: current.filter(r => r !== ageRange)
        };
      } else if (current.length < 2) {
        return {
          ...prev,
          preferredAgeRanges: [...current, ageRange]
        };
      }
      return prev; // Don't add if already at limit of 2
    });
  };

  const handleNext = async () => {
    console.log('🔵 handleNext FIRED - currentStep:', currentStep);
    
    if (isProcessing) {
      console.log('⏳ Already processing, ignoring duplicate click');
      return;
    }
    
    console.log('🔄 Step:', currentStep, 'of', totalSteps, '| canProceed:', canProceed());
    
    try {
      setIsProcessing(true);
      console.log('✅ Set isProcessing to true');
      
      if (currentStep < totalSteps) {
        const nextStep = currentStep + 1;
        console.log('➡️ Moving from step', currentStep, 'to step', nextStep);
        
        setCurrentStep(nextStep);
        console.log('✅ setCurrentStep called with:', nextStep);
        
        // Scroll to top of page on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('✅ Scrolled to top');
        
        // Short delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setIsProcessing(false);
        console.log('✅ Step change complete - now on step:', nextStep);
      } else {
        // Complete profile setup - pass data back to parent
        console.log('🎉 Completing profile setup (final step)');
        
        // Add a small delay to ensure UI feedback
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('📋 Calling onProfileComplete');
        onProfileComplete(profileData);
        console.log('✅ onProfileComplete called successfully');
        // Note: Don't setIsProcessing(false) here as component will unmount
      }
    } catch (error) {
      console.error('❌ Error in handleNext:', error);
      setIsProcessing(false);
      alert('There was an error processing your request. Please try again.\n\nError: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canProceed = () => {
    try {
      console.log('🔍 canProceed check - Step:', currentStep);
      
      switch (currentStep) {
        case 1:
          // Step 1: Photos & Basic Info - Require at least 1 photo and basic info
          const hasBasicInfo = !!(profileData.name && profileData.age && profileData.gender && profileData.location);
          const step1Result = profileData.photos.length >= 1 && hasBasicInfo;
          console.log('✅ Step 1: Can proceed?', step1Result, '- Photos:', profileData.photos.length, 'Basic info:', hasBasicInfo);
          return step1Result;
          
        case 2:
          // Step 2: Professional Info - Require profession, education, and at least 3 interests
          const step2Result = !!(profileData.profession && profileData.education && profileData.interests.length >= 3);
          console.log('✅ Step 2: Can proceed?', step2Result, '- Profession:', !!profileData.profession, 'Education:', !!profileData.education, 'Interests:', profileData.interests.length);
          return step2Result;
          
        case 3:
          // Step 3: Bio & Looking For - Only require "looking for" selection
          const step3Result = !!profileData.lookingFor;
          console.log('✅ Step 3: Can proceed?', step3Result, '- Looking for:', !!profileData.lookingFor);
          return step3Result;
          
        case 4:
          // Step 4: Dating Preferences - Require at least basic preferences
          const hasAgePrefs = profileData.preferredAgeRanges.length > 0 && !!profileData.ageFlexibility;
          const hasEthnicityPref = !!profileData.ethnicityFlexibility;
          const hasReligionPref = !!profileData.religionFlexibility;
          const hasImportanceRatings = Object.values(profileData.importanceRatings).every(rating => rating !== '');
          const step4Result = hasAgePrefs && hasEthnicityPref && hasReligionPref && hasImportanceRatings;
          console.log('✅ Step 4: Can proceed?', step4Result, '- Age prefs:', hasAgePrefs, 'Ethnicity pref:', hasEthnicityPref, 'Religion pref:', hasReligionPref, 'Importance ratings:', hasImportanceRatings);
          return step4Result;
          
        case 5:
          // Step 5: Review - Always allow completion
          console.log('✅ Step 5: Can proceed? true (Review step)');
          return true;
          
        default:
          console.log('❌ Invalid step:', currentStep);
          return false;
      }
    } catch (error) {
      console.error('❌ Error in canProceed:', error);
      return false; // Default to not allowing proceed on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-4 sm:py-8 pb-32 sm:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Sticky on Mobile */}
        <div className="sticky top-0 z-30 bg-gradient-to-br from-pink-50 to-purple-50 pt-4 pb-4 sm:pb-6 mb-2 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static">
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Complete your MingleMood profile
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Less than 5 minutes to get matched
            </p>
            <div className="mt-4 sm:mt-6">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-2">
                Step {currentStep} of {totalSteps}
                {currentStep === 1 && " - Photos & Basic Info"}
                {currentStep === 2 && " - Professional Details"}
                {currentStep === 3 && " - About You"}
                {currentStep === 4 && " - Dating Preferences"}
                {currentStep === 5 && " - Review & Complete"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Step Indicator Pills */}
        <div className="sm:hidden mb-4 flex justify-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                step === currentStep
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-600 shadow-lg scale-110'
                  : step < currentStep
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-400 border-gray-300'
              }`}
            >
              {step < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="font-bold">{step}</span>
              )}
            </div>
          ))}
        </div>

        {/* Validation Helper */}
        <div className="hidden sm:block">
          {!canProceed() && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-pink-600 font-medium animate-bounce">
              <span>↓</span>
              <span>Fill required fields to continue</span>
              <span>↓</span>
            </div>
          )}
          {canProceed() && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-green-600 font-medium">
              <span>✓</span>
              <span>Ready to continue</span>
              <span>✓</span>
            </div>
          )}
        </div>

        <Card key={`step-${currentStep}`} className="overflow-hidden">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Step 1: Photos & Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Add Your Best Photos & Basic Info</h2>
                  <p className="text-gray-600 mb-1">
                    <strong>Required:</strong> At least 1 photo, Name, Age, Gender, and Location 
                    {isMobileDevice ? ' Tap the button below to select photos from your gallery.' : ' You can select photos from your files.'}
                  </p>
                  {isMobileDevice && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl text-sm">
                      <div className="flex items-start text-blue-800">
                        <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-blue-900 mb-2">📱 Photo Upload:</p>
                          <div className="text-blue-700">
                            <p>Tap the "Add Photo" button below to select images from your photo gallery or camera roll.</p>
                          </div>
                          <p className="text-blue-600 text-xs mt-2 italic">💡 Allow photo library permissions when prompted</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Upload Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {profileData.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <ImageWithFallback
                        src={photo}
                        alt={`Profile photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                        title={`Remove photo ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded shadow">
                          Main Photo
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {profileData.photos.length < 6 && (
                    <button
                      onClick={() => handlePhotoUpload('gallery')}
                      disabled={uploadingPhoto}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-pink-400 active:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px] bg-gray-50 hover:bg-gray-100"
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-2"></div>
                          <span className="text-sm text-gray-500 text-center px-2">Processing...</span>
                          <span className="text-xs text-gray-400 text-center px-1">Please wait</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-pink-400 mb-2" />
                          <span className="text-sm font-medium text-gray-600 text-center px-2">
                            Add Photo
                          </span>
                          <span className="text-xs text-gray-400 mt-1 text-center px-2">
                            From Gallery
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Basic Info */}
                <div className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Your age"
                      value={profileData.age}
                      onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                    <Select value={profileData.gender} onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="woman">Woman</SelectItem>
                        <SelectItem value="man">Man</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                    <Select value={profileData.location} onValueChange={(value) => setProfileData(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional & Personal Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Professional & Personal Details</h2>
                  <p className="text-gray-600 mb-1"><strong>Required:</strong> Profession, Education, and at least 3 interests</p>
                  <p className="text-gray-500 text-sm">Social media links are optional</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profession">Profession <span className="text-red-500">*</span></Label>
                    <Input
                      id="profession"
                      type="text"
                      placeholder="What do you do for work?"
                      value={profileData.profession}
                      onChange={(e) => setProfileData(prev => ({ ...prev, profession: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="education">Education <span className="text-red-500">*</span></Label>
                    <Input
                      id="education"
                      type="text"
                      placeholder="Your highest education level"
                      value={profileData.education}
                      onChange={(e) => setProfileData(prev => ({ ...prev, education: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Select value={profileData.religion} onValueChange={(value) => setProfileData(prev => ({ ...prev, religion: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        {religions.map((religion) => (
                          <SelectItem key={religion} value={religion}>{religion}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ethnicity">Ethnicity</Label>
                    <Select value={profileData.ethnicity} onValueChange={(value) => setProfileData(prev => ({ ...prev, ethnicity: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ethnicities.map((ethnicity) => (
                          <SelectItem key={ethnicity} value={ethnicity}>{ethnicity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Interests (select at least 3) <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {availableInterests.map((interest) => (
                      <div
                        key={interest}
                        className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-colors ${
                          profileData.interests.includes(interest)
                            ? 'bg-pink-100 border-pink-300 text-pink-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {profileData.interests.length} (minimum 3 required)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile (optional)</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profileData.socialMedia?.linkedin || ''}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        socialMedia: { ...(prev.socialMedia || {}), linkedin: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram Handle (optional)</Label>
                    <Input
                      id="instagram"
                      type="text"
                      placeholder="@yourusername"
                      value={profileData.socialMedia?.instagram || ''}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        socialMedia: { ...(prev.socialMedia || {}), instagram: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Bio & Looking For */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Tell Us About Yourself</h2>
                  <p className="text-gray-600 mb-1"><strong>Required:</strong> What you're looking for</p>
                  <p className="text-gray-500 text-sm">Bio is optional but recommended</p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself, your passions, and what makes you unique..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="lookingFor">What are you looking for? <span className="text-red-500">*</span></Label>
                  <Select value={profileData.lookingFor} onValueChange={(value) => setProfileData(prev => ({ ...prev, lookingFor: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select what you're looking for" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serious-relationship">Serious relationship</SelectItem>
                      <SelectItem value="long-term-dating">Long-term dating</SelectItem>
                      <SelectItem value="casual-dating">Casual dating</SelectItem>
                      <SelectItem value="new-friends">New friends</SelectItem>
                      <SelectItem value="networking">Professional networking</SelectItem>
                      <SelectItem value="open-to-see">Open to see what happens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 4: Detailed Preferences */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Your Dating Preferences</h2>
                  <p className="text-gray-600 mb-1"><strong>Required:</strong> Age ranges, flexibility options, and importance ratings</p>
                  <p className="text-gray-500 text-sm">All fields help us find better matches for you</p>
                </div>

                {/* Step 4 Progress Indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900">Progress:</span>
                    <span className="text-blue-600">
                      {[
                        profileData.preferredAgeRanges.length > 0,
                        !!profileData.ageFlexibility,
                        !!profileData.ethnicityFlexibility,
                        !!profileData.religionFlexibility,
                        Object.values(profileData.importanceRatings).filter(r => r !== '').length === 6
                      ].filter(Boolean).length} / 5 sections complete
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div className="flex items-center gap-2">
                      {profileData.preferredAgeRanges.length > 0 ? '✅' : '⭕'} Age ranges selected
                    </div>
                    <div className="flex items-center gap-2">
                      {!!profileData.ageFlexibility ? '✅' : '⭕'} Age flexibility set
                    </div>
                    <div className="flex items-center gap-2">
                      {!!profileData.ethnicityFlexibility ? '✅' : '⭕'} Ethnicity flexibility set
                    </div>
                    <div className="flex items-center gap-2">
                      {!!profileData.religionFlexibility ? '✅' : '⭕'} Religion flexibility set
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.values(profileData.importanceRatings).filter(r => r !== '').length === 6 ? '✅' : '⭕'} 
                      All 6 importance ratings ({Object.values(profileData.importanceRatings).filter(r => r !== '').length}/6)
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Preferred Age Ranges (select up to 2) <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {ageRangeOptions.map((range) => (
                      <div
                        key={range}
                        className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-colors ${
                          profileData.preferredAgeRanges.includes(range)
                            ? 'bg-pink-100 border-pink-300 text-pink-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => togglePreferredAgeRange(range)}
                      >
                        {range}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {profileData.preferredAgeRanges.length} (maximum 2)
                  </p>
                </div>

                <div>
                  <Label>Age Range Flexibility <span className="text-red-500">*</span></Label>
                  <Select value={profileData.ageFlexibility} onValueChange={(value) => setProfileData(prev => ({ ...prev, ageFlexibility: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Are you flexible with age ranges?" />
                    </SelectTrigger>
                    <SelectContent>
                      {flexibilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preferred Ethnicities (select up to 5, or select "All races")</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {ethnicities.map((ethnicity) => (
                      <div
                        key={ethnicity}
                        className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-colors ${
                          profileData.preferredEthnicities.includes(ethnicity)
                            ? 'bg-pink-100 border-pink-300 text-pink-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => togglePreferredEthnicity(ethnicity)}
                      >
                        {ethnicity}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {profileData.preferredEthnicities.length} (maximum 5)
                  </p>
                </div>

                <div>
                  <Label>Ethnicity Flexibility <span className="text-red-500">*</span></Label>
                  <Select value={profileData.ethnicityFlexibility} onValueChange={(value) => setProfileData(prev => ({ ...prev, ethnicityFlexibility: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Are you flexible with ethnicity preferences?" />
                    </SelectTrigger>
                    <SelectContent>
                      {flexibilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preferred Religions (select up to 5, or select "All religion preferences")</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {religions.map((religion) => (
                      <div
                        key={religion}
                        className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-colors ${
                          profileData.preferredReligions.includes(religion)
                            ? 'bg-pink-100 border-pink-300 text-pink-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => togglePreferredReligion(religion)}
                      >
                        {religion}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {profileData.preferredReligions.length} (maximum 5)
                  </p>
                </div>

                <div>
                  <Label>Religion Flexibility <span className="text-red-500">*</span></Label>
                  <Select value={profileData.religionFlexibility} onValueChange={(value) => setProfileData(prev => ({ ...prev, religionFlexibility: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Are you flexible with religion preferences?" />
                    </SelectTrigger>
                    <SelectContent>
                      {flexibilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Rate the importance of the following factors: <span className="text-red-500">*</span></Label>
                  
                  {Object.entries({
                    looks: 'Physical Appearance',
                    career: 'Career/Professional Success',
                    age: 'Age Compatibility',
                    ethnicity: 'Ethnicity/Cultural Background',
                    religion: 'Religious/Spiritual Beliefs',
                    location: 'Geographic Location'
                  }).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-sm">{label}</Label>
                      <Select
                        value={profileData.importanceRatings[key as keyof typeof profileData.importanceRatings]}
                        onValueChange={(value) => setProfileData(prev => ({
                          ...prev,
                          importanceRatings: {
                            ...prev.importanceRatings,
                            [key]: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Rate importance of ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {importanceOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Review Your Profile</h2>
                  <p className="text-gray-600">Make sure everything looks good before completing your profile</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Photos ({profileData.photos.length})</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {profileData.photos.map((photo, index) => (
                        <ImageWithFallback
                          key={index}
                          src={photo}
                          alt={`Profile photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">Basic Info</h3>
                      <p>{profileData.name}, {profileData.age}</p>
                      <p>{profileData.location}</p>
                      <p>{profileData.profession}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold">Interests</h3>
                      <div className="flex flex-wrap gap-1">
                        {profileData.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold">Looking For</h3>
                      <p className="capitalize">{profileData.lookingFor.replace('-', ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-pink-800">🎉 Ready to Join MingleMood!</h3>
                  <p className="text-pink-700 text-sm">
                    Your profile is looking great! Once you complete this step, you'll gain access to exclusive events and curated matches in your area.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Desktop */}
        <div className="hidden sm:block mt-6 sm:mt-8 mb-6 sm:mb-8">
          {/* Helper text when button is disabled */}
          {!canProceed() && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
              <p className="text-sm sm:text-base text-center text-red-700 font-semibold">
                {currentStep === 1 && 
                  "📸 Add at least 1 photo and complete Name, Age, Gender, and Location"}
                {currentStep === 2 && 
                  "💼 Complete Profession, Education, and select at least 3 interests"}
                {currentStep === 3 && 
                  "💭 Select what you're looking for in a relationship"}
                {currentStep === 4 && 
                  "✨ Complete all dating preferences (age ranges, flexibility options, and importance ratings)"}
                {currentStep === 5 &&
                  "✅ Review your profile and click Complete Profile when ready"}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center gap-3 sm:gap-4">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none touch-manipulation min-h-[52px] sm:min-h-[48px] font-semibold text-base sm:text-lg border-2 hover:bg-gray-100 active:scale-95 transition-transform"
              >
                ← Back
              </Button>
            )}
            
            {/* Spacer for first step */}
            {currentStep === 1 && <div className="flex-1"></div>}

            {/* Next/Complete Button */}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isProcessing}
              size="lg"
              className="flex-1 sm:flex-none bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation min-h-[52px] sm:min-h-[48px] min-w-[180px] sm:min-w-[200px] font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all border-0"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{currentStep === totalSteps ? 'Saving...' : 'Processing...'}</span>
                </span>
              ) : currentStep === totalSteps ? (
                <span className="flex items-center justify-center gap-2">
                  <span>Complete Profile</span>
                  <span className="text-xl">✓</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Continue</span>
                  <span className="text-xl">→</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Sticky Navigation - Fixed at bottom */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 shadow-2xl">
          {/* Helper text when button is disabled - Mobile */}
          {!canProceed() && (
            <div className="px-4 pt-3 pb-2 bg-red-50 border-b-2 border-red-200">
              <p className="text-xs text-center text-red-700 font-semibold leading-tight">
                {currentStep === 1 && 
                  "📸 Add 1+ photo, Name, Age, Gender, Location"}
                {currentStep === 2 && 
                  "💼 Complete Profession, Education, 3+ interests"}
                {currentStep === 3 && 
                  "💭 Select what you're looking for"}
                {currentStep === 4 && 
                  "✨ Complete all preferences below"}
                {currentStep === 5 &&
                  "✅ Ready! Click Complete Profile"}
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-2 p-3">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1 touch-manipulation min-h-[52px] font-semibold text-base border-2 hover:bg-gray-100 active:scale-95 transition-transform"
              >
                ← Back
              </Button>
            )}

            {/* Next/Complete Button */}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isProcessing}
              size="lg"
              className={`${currentStep === 1 ? 'flex-1' : 'flex-[2]'} bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation min-h-[52px] font-bold text-base shadow-xl hover:shadow-2xl active:scale-95 transition-all border-0`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{currentStep === totalSteps ? 'Saving...' : 'Processing...'}</span>
                </span>
              ) : currentStep === totalSteps ? (
                <span className="flex items-center justify-center gap-2">
                  <span>Complete Profile</span>
                  <span className="text-xl">✓</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Continue ({currentStep}/{totalSteps})</span>
                  <span className="text-xl">→</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Debug Panel - Fixed at bottom */}
        {isMobileDevice && (
          <div className="fixed bottom-20 right-4 z-50">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg text-xs font-bold"
            >
              {showDebug ? '✕' : '🐛'}
            </button>
            
            {showDebug && (
              <div className="absolute bottom-12 right-0 bg-white border-2 border-blue-600 rounded-lg shadow-2xl p-4 w-72 max-h-96 overflow-y-auto text-xs">
                <h3 className="font-bold mb-2 text-blue-900">Debug Info</h3>
                <div className="space-y-1 text-gray-800">
                  <p><strong>Current Step:</strong> {currentStep} of {totalSteps}</p>
                  <p><strong>Processing:</strong> {isProcessing ? 'Yes' : 'No'}</p>
                  <p><strong>Can Proceed:</strong> {canProceed() ? 'Yes' : 'No'}</p>
                  <p><strong>Photos:</strong> {profileData.photos.length}</p>
                  <p><strong>Name:</strong> {profileData.name || '(empty)'}</p>
                  <p><strong>Age:</strong> {profileData.age || '(empty)'}</p>
                  <p><strong>Gender:</strong> {profileData.gender || '(empty)'}</p>
                  <p><strong>Location:</strong> {profileData.location || '(empty)'}</p>
                  {currentStep === 2 && (
                    <>
                      <p><strong>Profession:</strong> {profileData.profession || '(empty)'}</p>
                      <p><strong>Education:</strong> {profileData.education || '(empty)'}</p>
                      <p><strong>Interests:</strong> {profileData.interests.length}</p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <p><strong>Looking For:</strong> {profileData.lookingFor || '(empty)'}</p>
                  )}
                  <hr className="my-2" />
                  <p className="text-xs text-gray-600">Check browser console for detailed logs</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
