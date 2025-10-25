import React from 'react';
import { ArrowRight, Heart, Shield, Users, Sparkles, Calendar, Star, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface LandingPageVibrantProps {
  onGetStarted: () => void;
}

export function LandingPageVibrant({ onGetStarted }: LandingPageVibrantProps) {
  return (
    <div className="min-h-screen bg-[#01180B] text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#BF94EA] rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FA7872] rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#CDEDB2] rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header - Bold */}
      <header className="fixed top-0 w-full bg-[#01180B]/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-xl flex items-center justify-center shadow-xl">
              <span className="text-xl font-bold text-white">MM</span>
            </div>
            <div>
              <h1 className="font-bold text-white">MingleMood Social</h1>
              <p className="text-xs text-white/60">Exclusive Club</p>
            </div>
          </div>
          <Button 
            onClick={onGetStarted}
            className="bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] hover:opacity-90 text-white shadow-xl"
          >
            Join Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section - Bold & Vibrant */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-6">
                <div className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] text-white px-6 py-3 rounded-full font-semibold text-sm shadow-xl">
                  <Sparkles className="inline h-4 w-4 mr-2" />
                  400+ Vetted Members • 100% Private
                </div>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-8 leading-tight">
                <span className="block text-white">Stop Swiping.</span>
                <span className="block bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] bg-clip-text text-transparent">
                  Start Living.
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
                The exclusive club where vetted professionals meet IRL.
                <span className="block mt-2 font-semibold text-[#CDEDB2]">No apps. No ghosting. Just real connections.</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] hover:opacity-90 text-white shadow-2xl px-10 py-7 text-xl font-bold"
              >
                <Zap className="mr-2 h-6 w-6" />
                Get Started Free
              </Button>
              <p className="text-sm text-white/60">5 minutes • 100% discreet • Invite-only</p>
            </motion.div>
          </div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {[
              { icon: Users, stat: '400+', label: 'Vetted Singles' },
              { icon: Shield, stat: '100%', label: 'Privacy Protected' },
              { icon: Star, stat: 'IRL', label: 'Real Connections' },
              { icon: Calendar, stat: 'Weekly', label: 'Curated Events' }
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300"
              >
                <item.icon className="h-8 w-8 mx-auto mb-3 text-[#CDEDB2]" />
                <div className="text-3xl font-bold text-white mb-1">{item.stat}</div>
                <div className="text-sm text-white/60">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pain Points - Dynamic Cards */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-4">
            Why MingleMood Wins
          </h2>
          <p className="text-center text-white/60 mb-12 text-lg">The dating app alternative you've been waiting for</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                emoji: '❌', 
                title: 'No Swiping Fatigue',
                description: 'Goodbye endless scrolling, ghosting, and catfishes. Meet real people, in person.',
                color: 'from-[#FA7872] to-[#E53A29]'
              },
              { 
                emoji: '🛡️', 
                title: 'Safe & Secure',
                description: 'Every member is vetted. Every event is curated. Your safety is our priority.',
                color: 'from-[#CDEDB2] to-[#BF94EA]'
              },
              { 
                emoji: '✨', 
                title: 'Quality > Quantity',
                description: 'Hand-picked professional singles. No randomness. Just perfect matches.',
                color: 'from-[#BF94EA] to-[#FA7872]'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300`}>
                  {item.emoji}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/70 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Bold Timeline */}
      <section className="relative z-10 py-20 px-6 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-16">
            Three Steps to Your Perfect Match
          </h2>
          
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Get Profiled',
                description: 'Create your profile in 5 minutes. We match you based on values, not just looks.',
                color: 'from-[#BF94EA] to-[#FA7872]'
              },
              {
                step: '02',
                title: 'Get Accepted',
                description: 'Our team reviews every application. Only the best matches make it through.',
                color: 'from-[#FA7872] to-[#E53A29]'
              },
              {
                step: '03',
                title: 'Get Invited',
                description: 'Receive exclusive invites to curated events with your perfect matches.',
                color: 'from-[#CDEDB2] to-[#BF94EA]'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex gap-6 items-start group"
              >
                <div className={`flex-shrink-0 w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center font-black text-2xl text-white group-hover:scale-110 transition-transform duration-300`}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/70 text-lg leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Explosive */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-[#BF94EA] via-[#FA7872] to-[#E53A29] rounded-3xl p-12 shadow-2xl">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
                Your Perfect Match Awaits
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Join 400+ vetted professionals finding real connections.
                <span className="block mt-2 font-semibold">Free to start. 5 minutes to complete. 100% exclusive.</span>
              </p>
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-white text-[#BF94EA] hover:bg-gray-100 shadow-2xl px-12 py-8 text-2xl font-black"
              >
                <Zap className="mr-3 h-7 w-7" />
                Start Now
                <ArrowRight className="ml-3 h-7 w-7" />
              </Button>
              <p className="text-sm text-white/70 mt-6">
                🔒 Not all profiles are accepted • Invite-only membership
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Bold */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">MM</span>
            </div>
            <span className="text-xl font-bold text-white">MingleMood Social</span>
          </div>
          <p className="text-white/50 text-sm">© {new Date().getFullYear()} MingleMood Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
