import React from 'react';
import { ArrowRight, Check, Shield, Star, Award } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageLuxuryProps {
  onGetStarted: () => void;
}

export function LandingPageLuxury({ onGetStarted }: LandingPageLuxuryProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Elegant Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#BF94EA] to-[#FA7872] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl font-serif font-bold text-white">MM</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E53A29] rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl text-[#01180B]">MingleMood Social</h1>
              <p className="text-xs text-gray-500 tracking-wide uppercase">Exclusive Membership</p>
            </div>
          </div>
          <Button 
            onClick={onGetStarted}
            className="bg-[#01180B] hover:bg-[#01180B]/90 text-white font-medium"
          >
            Apply Now
          </Button>
        </div>
      </header>

      {/* Hero Section - Luxury */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 border border-[#BF94EA]/30 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full mb-8 shadow-sm">
              <Award className="h-4 w-4 text-[#BF94EA]" />
              <span className="text-sm font-medium text-[#01180B] tracking-wide">INVITE-ONLY CLUB</span>
              <div className="w-1.5 h-1.5 bg-[#BF94EA] rounded-full"></div>
              <span className="text-sm text-gray-600">Since 2024</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#01180B] mb-8 leading-tight">
              Where Exceptional<br />
              <span className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] bg-clip-text text-transparent">
                Connections Begin
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              An exclusive club for discerning professionals seeking meaningful relationships.
              <span className="block mt-3 text-gray-500">No swiping. No ghosting. Just curated, in-person experiences with vetted matches.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:opacity-90 text-white px-10 py-7 text-lg font-medium shadow-xl"
              >
                Begin Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Check className="h-4 w-4 text-[#CDEDB2]" />
                <span>Complimentary consultation</span>
              </div>
            </div>
          </div>

          {/* Elegant Stats Bar */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center border-r border-gray-200/50 last:border-0">
                <div className="text-3xl font-serif font-bold text-[#01180B] mb-1">400+</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Vetted Members</div>
              </div>
              <div className="text-center border-r border-gray-200/50 last:border-0">
                <div className="text-3xl font-serif font-bold text-[#01180B] mb-1">100%</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Private</div>
              </div>
              <div className="text-center border-r border-gray-200/50 last:border-0">
                <div className="text-3xl font-serif font-bold text-[#01180B] mb-1">
                  <Star className="inline h-8 w-8 fill-[#E53A29] text-[#E53A29]" />
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Curated Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-serif font-bold text-[#01180B] mb-1">IRL</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Real Meetings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions - Elegant Cards */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#01180B] mb-4">
              The MingleMood Difference
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
              A refined approach to modern dating, designed for those who value quality and discretion
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Curated Matching',
                description: 'Our concierge team personally selects compatible matches based on your values, ambitions, and lifestyle preferences.',
                icon: '👥'
              },
              {
                title: 'Exclusive Events',
                description: 'Attend sophisticated gatherings and unique experiences that go far beyond traditional speed dating or dinners.',
                icon: '🥂'
              },
              {
                title: 'Complete Discretion',
                description: 'Your privacy is paramount. No public profiles, no swiping, no digital footprint—just confidential introductions.',
                icon: '🔒'
              },
              {
                title: 'Vetted Community',
                description: 'Every member undergoes a thorough vetting process. Not all applications are accepted—membership is a privilege.',
                icon: '✨'
              },
              {
                title: 'Safety Guaranteed',
                description: 'Meet in carefully selected venues with our team present. Your security and comfort are our top priorities.',
                icon: '🛡️'
              },
              {
                title: 'Quality Focus',
                description: 'We prioritize meaningful connections over volume. Each introduction is thoughtfully considered and intentional.',
                icon: '💎'
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-50 to-purple-50/30 border border-gray-200/50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-serif font-semibold text-[#01180B] mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Elegant Process */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#BF94EA]/5 to-[#FA7872]/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#01180B] mb-4">
              Your Journey to Connection
            </h2>
            <p className="text-lg text-gray-600 font-light">Three thoughtful steps to finding your perfect match</p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#BF94EA] via-[#FA7872] to-[#E53A29]"></div>

            <div className="space-y-16">
              {[
                {
                  number: '01',
                  title: 'Application & Profile',
                  description: 'Complete our thoughtful questionnaire. Share your story, values, and what you seek in a partner. This process takes approximately 5 minutes and is completely confidential.',
                  details: ['Complimentary to begin', 'Complete privacy assured', 'Personalized consultation']
                },
                {
                  number: '02',
                  title: 'Review & Acceptance',
                  description: 'Our experienced team carefully reviews each application. We ensure every member aligns with our community values and standards of excellence.',
                  details: ['Thorough vetting process', 'Selective membership', 'Quality assurance']
                },
                {
                  number: '03',
                  title: 'Exclusive Invitations',
                  description: 'Receive personal invitations to curated events where you\'ll meet hand-selected matches in elegant, comfortable settings.',
                  details: ['Premium venues', 'Curated guest list', 'Memorable experiences']
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className={`lg:grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}>
                    <div className={index % 2 === 0 ? '' : 'lg:col-start-2'}>
                      <div className="bg-white border border-gray-200/50 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#BF94EA] to-[#FA7872] rounded-xl flex items-center justify-center shadow-md">
                            <span className="font-serif font-bold text-white text-xl">{item.number}</span>
                          </div>
                          <h3 className="text-2xl font-serif font-semibold text-[#01180B]">{item.title}</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-6 font-light">{item.description}</p>
                        <div className="space-y-2">
                          {item.details.map((detail, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-[#CDEDB2]" />
                              <span className="text-sm text-gray-600">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Luxury */}
      <section className="py-24 px-6 bg-[#01180B] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#BF94EA]/10 to-[#FA7872]/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <Shield className="h-12 w-12 text-[#CDEDB2] mx-auto mb-4" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            Begin Your Exclusive Journey
          </h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed font-light max-w-2xl mx-auto">
            Join a distinguished community of professionals who value authenticity, connection, and meaningful relationships.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-white text-[#01180B] hover:bg-gray-100 shadow-2xl px-12 py-8 text-xl font-medium"
          >
            Apply for Membership
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          <p className="text-sm text-white/60 mt-6 font-light">
            Membership is by invitation and application only
          </p>
        </div>
      </section>

      {/* Footer - Elegant */}
      <footer className="py-12 px-6 bg-white border-t border-gray-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#BF94EA] to-[#FA7872] rounded-lg flex items-center justify-center">
                <span className="font-serif font-bold text-white">MM</span>
              </div>
              <div className="text-left">
                <span className="font-serif font-bold text-[#01180B] block">MingleMood Social</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Exclusive Membership</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-light">© {new Date().getFullYear()} MingleMood Social. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
