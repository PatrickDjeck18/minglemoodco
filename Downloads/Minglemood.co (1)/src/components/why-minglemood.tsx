import React from 'react';
import { ArrowRight, Check, Shield, Sparkles, Users, Heart, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface WhyMingleMoodProps {
  onGetStarted: () => void;
  onBack: () => void;
}

export function WhyMingleMood({ onGetStarted, onBack }: WhyMingleMoodProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-foreground hover:bg-foreground/5"
          >
            ← Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl mb-6 text-foreground leading-tight">
          A New Way to Meet
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground mb-8 leading-relaxed">
          No Swiping. No Awkward Speed Dating. No Ghosting.
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] mx-auto rounded-full"></div>
      </section>

      {/* Introduction */}
      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed mb-8">
          Dating apps have made finding connection harder, not easier.
          <br />
          <strong className="text-foreground">MingleMood is for people who want something real</strong> — not another scroll or algorithm.
        </p>
        
        <Button
          onClick={onGetStarted}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300"
        >
          Get Invited
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* The Problem */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-lg border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#E53A29]/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <h2 className="text-3xl text-foreground">The Problem</h2>
          </div>
          
          <p className="text-lg text-foreground/80 mb-8">
            Most singles are stuck between two extremes: swiping endlessly online or showing up to random singles events that feel forced.
          </p>

          <div className="space-y-4">
            {[
              "You never know who's real (or safe).",
              "Conversations fade before they even start.",
              "Meeting someone genuine feels harder than ever."
            ].map((problem, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-[#E53A29]/5 rounded-xl">
                <div className="w-6 h-6 bg-[#E53A29] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✕</span>
                </div>
                <p className="text-foreground/80">{problem}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-[#BF94EA]/10 via-[#FA7872]/10 to-[#CDEDB2]/20 rounded-2xl border-2 border-[#BF94EA]/30">
            <p className="text-xl text-foreground italic">
              <strong className="text-foreground">You deserve better</strong> — something human, intentional, and actually fun.
            </p>
          </div>
        </div>
      </section>

      {/* The MingleMood Way */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-[#BF94EA]/10 via-[#FA7872]/10 to-[#CDEDB2]/20 rounded-3xl p-8 sm:p-12 shadow-lg border border-[#BF94EA]/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl text-foreground">The MingleMood Way</h2>
          </div>
          
          <h3 className="text-2xl mb-4 text-foreground">Meet IRL — Effortlessly.</h3>
          
          <p className="text-lg text-foreground/80 mb-6 leading-relaxed">
            No ghosting, no awkward introductions, no shallow connections.
            <br />
            Just real people who have been privately invited to meet in real life based on compatibility.
          </p>

          <p className="text-lg text-foreground/80 leading-relaxed mb-8">
            If sparks fly — awesome! If not, no pressure. We&apos;ll provide you with more matches.
          </p>

          <div className="flex justify-center">
            <Button
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Start Mingling
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Our Difference */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
            <h2 className="text-4xl text-foreground">Our Difference</h2>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Curated, Not Crowded */}
          <Card className="border-[#BF94EA]/20 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-[#BF94EA]/10 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-[#BF94EA]" />
              </div>
              <h3 className="text-xl mb-3 text-foreground">Curated, Not Crowded</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not everyone is accepted into our handpicked, invite-only system. 
                Our goal is high-quality connections.  We put you in front of people you actually want to meet, 
                based on your personal preferences and standards.
              </p>
            </CardContent>
          </Card>

          {/* Safe and Discreet */}
          <Card className="border-[#FA7872]/20 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-[#FA7872]/10 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-[#FA7872]" />
              </div>
              <h3 className="text-xl mb-3 text-foreground">Safe and Discreet</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every guest is pre-screened, and we keep your dating life private. 
                No public profiles. No catfishing. No random matches.
              </p>
            </CardContent>
          </Card>

          {/* Authentic Chemistry */}
          <Card className="border-[#CDEDB2]/40 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-[#CDEDB2]/40 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="text-xl mb-3 text-foreground">Authentic Chemistry</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our curated events are small enough to get to know everyone but large enough to have variety. 
                The goal is to meet naturally — through laughter, conversation, and shared experiences.
              </p>
            </CardContent>
          </Card>

          {/* Modern Matchmaking */}
          <Card className="border-[#BF94EA]/20 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl mb-3 text-foreground">Modern Matchmaking</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do the work — you just show up. 
                Our team (and smart matchmaking system) handles the rest.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Private & Invite-Only */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-8 sm:p-12 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl mb-4 text-white">
            🔒 Private. Discreet. Invite-Only.
          </h2>
          
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
            Your dating life stays private — no profiles, no swiping, no digital trail.
            <br />
            <strong className="text-white">It&apos;s connection, curated and confidential.</strong>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-[#BF94EA]/10 via-[#FA7872]/10 to-[#CDEDB2]/20 rounded-3xl p-8 sm:p-12 text-center border border-[#BF94EA]/20">
          <h2 className="text-3xl sm:text-4xl mb-4 text-foreground">
            💌 Ready to See Who&apos;s Waiting for You?
          </h2>
          
          <p className="text-lg text-foreground/80 mb-8 leading-relaxed">
            Starting your profile is free, private, and takes less than 5 minutes.
            <br />
            Get invited to events with singles who fit your energy — not just your filters.
          </p>

          <Button
            onClick={onGetStarted}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-lg sm:text-xl rounded-full shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            Start Your Profile
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
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
  );
}
