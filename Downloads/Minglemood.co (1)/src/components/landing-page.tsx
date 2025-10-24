import React from 'react';
import { Heart, Shield, Users, Sparkles, Check, ArrowRight, Calendar, Star, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl font-bold text-white">MM</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] bg-clip-text text-transparent">
                  MingleMood Social
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Curated Connections, Real Experiences</p>
              </div>
            </div>
            <Button 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:from-[#BF94EA]/90 hover:to-[#FA7872]/90 text-white shadow-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Pain Point Hook */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#BF94EA]/10 via-[#FA7872]/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] text-white border-0 px-4 py-2 text-sm">
              <Lock className="h-4 w-4 mr-2" />
              Invite-Only Exclusive Club
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#01180B] mb-6 leading-tight">
              No More Swiping.<br />
              <span className="bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] bg-clip-text text-transparent">
                Just Real Connections.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-8 leading-relaxed">
              Meet vetted professionals IRL in safe, fun, low-pressure group settings.
              <span className="block mt-2 font-semibold text-[#01180B]">If you click, you click. If not, no worries—we'll find better matches.</span>
            </p>

            {/* Pain Points Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">❌</div>
                <p className="font-semibold text-[#01180B] mb-2">No Endless Swiping</p>
                <p className="text-sm text-gray-600">Say goodbye to ghosting, catfishes, and shallow connections</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">🛡️</div>
                <p className="font-semibold text-[#01180B] mb-2">Safety First</p>
                <p className="text-sm text-gray-600">Less safety concerns than apps—meet in curated group settings</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">✨</div>
                <p className="font-semibold text-[#01180B] mb-2">Highly Vetted</p>
                <p className="text-sm text-gray-600">No randomness—only hand-picked professional singles</p>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:from-[#BF94EA]/90 hover:to-[#FA7872]/90 text-white shadow-xl text-lg px-8 py-6 w-full sm:w-auto"
              >
                Start Your Profile
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-gray-600">
                Free, discreet, takes less than 5 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#01180B] mb-4">
              Why MingleMood is Different
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              High-quality connections curated especially for you, with unique experiences that go beyond speed dating and dinners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Value Prop 1 */}
            <Card className="border-2 border-gray-200 hover:border-[#BF94EA] transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#BF94EA] to-[#FA7872] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#01180B] mb-3">Curated Matches</h3>
                <p className="text-gray-600 leading-relaxed">
                  Concierge-style matching based on compatibility, ambition, and values. Meet multiple vetted potentials at once.
                </p>
              </CardContent>
            </Card>

            {/* Value Prop 2 */}
            <Card className="border-2 border-gray-200 hover:border-[#FA7872] transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FA7872] to-[#E53A29] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#01180B] mb-3">Unique Experiences</h3>
                <p className="text-gray-600 leading-relaxed">
                  Fun, elevated events that feel spontaneous—like dating in the wild. Go beyond dinners with memorable activities.
                </p>
              </CardContent>
            </Card>

            {/* Value Prop 3 */}
            <Card className="border-2 border-gray-200 hover:border-[#CDEDB2] transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#CDEDB2] to-[#BF94EA] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-7 w-7 text-[#01180B]" />
                </div>
                <h3 className="text-xl font-bold text-[#01180B] mb-3">Complete Discretion</h3>
                <p className="text-gray-600 leading-relaxed">
                  Keep your dating life private. No swiping, no public profiles. Your privacy is protected at every step.
                </p>
              </CardContent>
            </Card>

            {/* Value Prop 4 */}
            <Card className="border-2 border-gray-200 hover:border-[#BF94EA] transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#BF94EA] to-[#CDEDB2] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#01180B] mb-3">Exclusive Club</h3>
                <p className="text-gray-600 leading-relaxed">
                  Small enough to feel like "friends of friends," but large enough for variety. Not all profiles are accepted.
                </p>
              </CardContent>
            </Card>

            {/* Value Prop 5 */}
            <Card className="border-2 border-gray-200 hover:border-[#FA7872] transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#E53A29] to-[#FA7872] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#01180B] mb-3">Safety & Security</h3>
                <p className="text-gray-600 leading-relaxed">
                  Meet in safe, vetted group settings. All members are carefully screened for quality and authenticity.
                </p>
              </CardContent>
            </Card>

            {/* Value Prop 6 */}
            <Card className="border-2 border-gray-200 hover:border-[#CDEDB2] transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#CDEDB2] to-[#BF94EA] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles className="h-7 w-7 text-[#01180B]" />
                </div>
                <h3 className="text-xl font-bold text-[#01180B] mb-3">Quality Over Quantity</h3>
                <p className="text-gray-600 leading-relaxed">
                  We focus on high-quality connections and interactions with vetted singles you actually want to meet.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#BF94EA]/5 via-[#FA7872]/5 to-[#CDEDB2]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#01180B] mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to start meeting your perfect matches
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-[#BF94EA] transition-all duration-300">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    1
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-[#01180B] mb-4">Get Profiled</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Join our invite-only database. We carefully select singles for you based on compatibility, ambition, and values.
                  </p>
                  <div className="flex items-start space-x-2 text-sm text-gray-500">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Takes less than 5 minutes</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>100% discreet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-[#FA7872] transition-all duration-300">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#FA7872] to-[#E53A29] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    2
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-[#01180B] mb-4">Get Accepted</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Your application is reviewed and vetted by our team. We ensure every member meets our quality standards.
                  </p>
                  <div className="flex items-start space-x-2 text-sm text-gray-500">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Carefully vetted members</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Hand-picked selections</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Invite-only basis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-[#CDEDB2] transition-all duration-300">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#CDEDB2] to-[#BF94EA] rounded-full flex items-center justify-center text-[#01180B] font-bold text-xl shadow-lg">
                    3
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-[#01180B] mb-4">Get Invited to Mingle</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    We invite you to memorable, elevated experiences with folks we think you'd like to meet.
                  </p>
                  <div className="flex items-start space-x-2 text-sm text-gray-500">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Curated events</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Perfect matches</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm text-gray-500 mt-2">
                    <Check className="h-5 w-5 text-[#CDEDB2] flex-shrink-0 mt-0.5" />
                    <span>Fun experiences</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="py-12 sm:py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#BF94EA] to-[#FA7872] bg-clip-text text-transparent mb-2">
                400+
              </div>
              <p className="text-gray-600 font-medium">Vetted Members</p>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#FA7872] to-[#E53A29] bg-clip-text text-transparent mb-2">
                100%
              </div>
              <p className="text-gray-600 font-medium">Privacy Protected</p>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#E53A29] to-[#CDEDB2] bg-clip-text text-transparent mb-2">
                <Star className="inline h-10 w-10 sm:h-12 sm:w-12 fill-current" />
              </div>
              <p className="text-gray-600 font-medium">Hand-Picked Events</p>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#CDEDB2] to-[#BF94EA] bg-clip-text text-transparent mb-2">
                IRL
              </div>
              <p className="text-gray-600 font-medium">Real Connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#BF94EA] via-[#FA7872] to-[#E53A29] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#01180B]/5"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Meet Your Match?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
            Starting your profile is free, discreet, and takes less than 5 minutes.
            <span className="block mt-2 font-semibold">Join the exclusive club for curated connections today.</span>
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-white text-[#BF94EA] hover:bg-gray-100 shadow-2xl text-lg px-10 py-7 font-bold"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-sm text-white/80 mt-6">
            Not all profiles are accepted • Invite-only basis
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#01180B] text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">MM</span>
              </div>
              <span className="text-xl font-bold">MingleMood Social</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Exclusive club for curated connections
            </p>
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} MingleMood Social. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
