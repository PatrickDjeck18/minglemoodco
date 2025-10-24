import React, { useEffect } from 'react';
import { CheckCircle, Sparkles, Calendar, Clock, Shield, Gift, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ThankYouComponentProps {
  user: any;
  onContinue: () => void;
}

export function ThankYouComponent({ user, onContinue }: ThankYouComponentProps) {
  useEffect(() => {
    console.log("✨ ThankYouComponent mounted - user:", user?.email);
    console.log("✨ ThankYouComponent props:", { hasUser: !!user, hasOnContinue: !!onContinue });
    
    // Scroll to top on mount (especially important for mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Add celebration confetti effect announcement for screen readers
    console.log("🎉 Thank You page displayed successfully");
    
    return () => {
      console.log("✨ ThankYouComponent unmounted");
    };
  }, [user]);

  if (!onContinue) {
    console.error("❌ ThankYouComponent: onContinue prop is missing!");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full">
        {/* Header with Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            MingleMood Social
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Exclusive club for curated connections</p>
        </div>

        {/* Main Thank You Card */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl">
          <CardHeader className="text-center pb-4 px-4 sm:px-6">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3 sm:p-4 animate-bounce">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-green-800 text-xl sm:text-2xl">
              🎉 Profile Submitted Successfully!
            </CardTitle>
            <p className="text-green-700 text-sm sm:text-base mt-2">
              Thank you for completing your profile. Here's what happens next:
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
            {/* Next Steps Section */}
            <div className="bg-white/70 rounded-lg p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3 flex items-center">
                <span className="text-xl mr-2">📋</span>
                What Happens Next?
              </h3>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold shadow-md">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 mr-2" />
                      <h4 className="font-semibold text-green-800 text-sm sm:text-base">Profile Review</h4>
                    </div>
                    <p className="text-green-700 text-sm sm:text-base">
                      Our team will review your profile and let you know if you're approved. We'll contact you via email within 1-2 business days.
                    </p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold shadow-md">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
                      <h4 className="font-semibold text-green-800 text-sm sm:text-base">Personalization Survey</h4>
                    </div>
                    <p className="text-green-700 text-sm sm:text-base">
                      Once approved, you'll receive a short 5-minute survey to fine-tune your matches. This helps us send you invites to events perfectly suited to your preferences.
                    </p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold shadow-md">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800 text-sm sm:text-base">Curated Event Invitations</h4>
                    </div>
                    <p className="text-green-700 text-sm sm:text-base">
                      We'll begin sending invites to exclusive curated dinners and events based on your preferences. You'll have 3 days to RSVP before your spot is released to the waitlist.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Benefits Section */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3 bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="bg-blue-100 rounded-full p-2 mt-0.5 flex-shrink-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 text-sm sm:text-base mb-1">Privacy Protected</p>
                  <p className="text-blue-700 text-xs sm:text-sm">
                    Your information will never be made public. All invitations are private and sent directly to you via email.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-purple-50 rounded-lg p-3 sm:p-4">
                <div className="bg-purple-100 rounded-full p-2 mt-0.5 flex-shrink-0">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-purple-800 text-sm sm:text-base mb-1">No Cost to Match</p>
                  <p className="text-purple-700 text-xs sm:text-sm">
                    There is no cost to be matched for events. You'll only pay when you RSVP for specific events you want to attend.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="border-t border-green-200 pt-5 sm:pt-6">
              <div className="bg-gradient-to-r from-white/70 to-white/50 rounded-lg p-4 sm:p-5 text-center border border-green-200">
                <p className="text-green-700 text-sm sm:text-base mb-2">
                  📧 <strong>We'll keep you updated at:</strong>
                </p>
                <p className="text-green-800 font-semibold text-base sm:text-lg mb-3">
                  {user?.email || 'your email'}
                </p>
                <p className="text-green-600 text-xs sm:text-sm">
                  Check your inbox and the <strong>Events section</strong> in your dashboard for updates on your approval status and upcoming opportunities.
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center pt-4 sm:pt-6">
              <Button 
                onClick={onContinue}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 sm:px-10 py-4 sm:py-3 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all touch-manipulation"
              >
                Continue to Dashboard →
              </Button>
              <p className="text-xs sm:text-sm text-green-600 mt-3">
                You can explore the dashboard now while we review your profile
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6 sm:mt-8 space-y-3">
          <div className="bg-white/60 rounded-lg p-4 sm:p-5 shadow-md">
            <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
              🎊 Welcome to MingleMood Social!
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              We're excited to help you make meaningful connections through exclusive curated events.
            </p>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500">
            Questions? Contact us at{" "}
            <a 
              href="mailto:hello@minglemood.co" 
              className="text-pink-600 hover:text-pink-700 font-semibold underline"
            >
              hello@minglemood.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}