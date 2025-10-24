import React from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageMinimalProps {
  onGetStarted: () => void;
}

export function LandingPageMinimal({ onGetStarted }: LandingPageMinimalProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#BF94EA] rounded-full flex items-center justify-center">
              <span className="font-bold text-white">MM</span>
            </div>
            <span className="font-semibold text-[#01180B]">MingleMood Social</span>
          </div>
          <Button 
            onClick={onGetStarted}
            className="bg-[#01180B] hover:bg-[#01180B]/90 text-white"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section - Minimal & Clean */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-[#CDEDB2]/20 text-[#01180B] px-4 py-2 rounded-full mb-8 border border-[#CDEDB2]">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Invite-Only Club</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#01180B] mb-6 leading-tight">
            No More Swiping.
            <br />
            <span className="text-[#BF94EA]">Just Real People.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Meet vetted professionals IRL in curated group settings. 
            If you click, you click. If not—we'll find better matches.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-[#BF94EA] hover:bg-[#BF94EA]/90 text-white px-8 py-6 text-lg"
            >
              Start Your Profile
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-gray-500">Free • Discreet • 5 minutes</p>
          </div>
        </div>
      </section>

      {/* Pain Points - Minimal Grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FA7872]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="font-semibold text-[#01180B] mb-2">No Endless Swiping</h3>
              <p className="text-gray-600 text-sm">Goodbye to ghosting, catfishes, and shallow connections</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#CDEDB2]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-semibold text-[#01180B] mb-2">Safety First</h3>
              <p className="text-gray-600 text-sm">Meet in safe, curated group settings only</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#BF94EA]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-[#01180B] mb-2">Highly Vetted</h3>
              <p className="text-gray-600 text-sm">Only hand-picked professional singles</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimal Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#01180B] mb-16">How It Works</h2>
          
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#BF94EA] text-white rounded-full flex items-center justify-center font-bold">1</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#01180B] mb-2">Get Profiled</h3>
                <p className="text-gray-600">Join our invite-only database. We select singles based on compatibility and values.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    Free to start
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    5 minutes
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    100% discreet
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#FA7872] text-white rounded-full flex items-center justify-center font-bold">2</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#01180B] mb-2">Get Accepted</h3>
                <p className="text-gray-600">Your application is carefully reviewed and vetted by our team.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    Hand-picked
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    Invite-only
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#E53A29] text-white rounded-full flex items-center justify-center font-bold">3</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#01180B] mb-2">Get Invited to Mingle</h3>
                <p className="text-gray-600">Receive invitations to memorable events with your perfect matches.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    Curated events
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-[#CDEDB2] mr-1" />
                    Perfect matches
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="py-20 px-6 bg-[#01180B] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Meet Your Match?</h2>
          <p className="text-xl text-white/80 mb-8">
            Starting your profile is free, discreet, and takes less than 5 minutes.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-white text-[#01180B] hover:bg-gray-100 px-8 py-6 text-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-white/60 mt-6">Not all profiles are accepted • Invite-only basis</p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-[#BF94EA] rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">MM</span>
            </div>
            <span className="font-semibold text-[#01180B]">MingleMood Social</span>
          </div>
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} MingleMood Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
