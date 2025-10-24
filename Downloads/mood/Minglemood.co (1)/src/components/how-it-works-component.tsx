import React from 'react';
import { User, Check, Calendar, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface HowItWorksComponentProps {
  onClose: () => void;
  onGetStarted: () => void;
}

export function HowItWorksComponent({ onClose, onGetStarted }: HowItWorksComponentProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Close Button - Top Right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 sm:top-8 sm:right-8 text-muted-foreground hover:text-foreground transition-colors p-2 z-50"
        aria-label="Close"
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        {/* How it Works Title - At Top */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight mb-3 sm:mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            How it Works
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-foreground mb-6 sm:mb-8 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            Just 5 minutes to start your free profile
          </p>
          <Button
            onClick={onGetStarted}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 sm:px-16 py-6 sm:py-7 text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest"
            style={{ letterSpacing: '0.15em' }}
          >
            Get Started
          </Button>
        </div>

        {/* Three Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16 mb-20 sm:mb-28 mt-16 sm:mt-20">
          {/* Step 1: GET PROFILED */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-2">
              <User className="h-12 w-12 sm:h-14 sm:w-14 text-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl sm:text-2xl text-foreground tracking-wide uppercase" style={{ letterSpacing: '0.05em' }}>
              Get Profiled
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xs">
              Let us get to know you.
            </p>
          </div>

          {/* Step 2: GET ACCEPTED */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-2">
              <Check className="h-12 w-12 sm:h-14 sm:w-14 text-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl sm:text-2xl text-foreground tracking-wide uppercase" style={{ letterSpacing: '0.05em' }}>
              Get Accepted
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xs">
              We review carefully.
            </p>
          </div>

          {/* Step 3: GET INVITED TO MINGLE */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-2">
              <Calendar className="h-12 w-12 sm:h-14 sm:w-14 text-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl sm:text-2xl text-foreground tracking-wide uppercase" style={{ letterSpacing: '0.05em' }}>
              Get Invited to Mingle
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xs">
              Receive invites to events and activities curated especially for you.
            </p>
          </div>
        </div>

        {/* What You'll Experience */}
        <section className="max-w-4xl mx-auto px-6 pb-20 mt-12 sm:mt-16">
          <Card className="bg-white rounded-3xl shadow-lg border border-[#CDEDB2]/40">
            <CardContent className="p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#CDEDB2]/60 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <h2 className="text-3xl text-foreground">What You&apos;ll Experience</h2>
              </div>

              <div className="space-y-4">
                {[
                  "High-quality matches chosen with intention",
                  "Unique social experiences — from dinners, outdoor activities, and rooftop mixers",
                  "A comfortable, no-stress atmosphere",
                  "Concierge-style introductions and post-event support",
                  "A growing community that feels like friends of friends"
                ].map((experience, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg text-foreground/80">{experience}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm text-primary-foreground">MM</span>
              </div>
              <span className="text-sm text-foreground font-medium">MingleMood Social</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Exclusive club for curated connections
            </p>
            <p className="text-sm text-foreground">
              Contact us:{" "}
              <a
                href="mailto:hello@minglemood.co"
                className="text-primary hover:underline"
              >
                hello@minglemood.co
              </a>
            </p>
            <div className="flex justify-center space-x-8 text-sm text-muted-foreground pt-4">
              <div className="tracking-wide">©{new Date().getFullYear()} MingleMood</div>
              <div className="hover:text-foreground cursor-pointer tracking-wide">Terms of Service</div>
              <div className="hover:text-foreground cursor-pointer tracking-wide">Privacy Policy</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
