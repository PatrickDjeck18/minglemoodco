import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LandingPage } from './landing-page';
import { LandingPageMinimal } from './landing-page-minimal';
import { LandingPageVibrant } from './landing-page-vibrant';
import { LandingPageLuxury } from './landing-page-luxury';

interface LandingPageSelectorProps {
  onGetStarted: () => void;
}

export function LandingPageSelector({ onGetStarted }: LandingPageSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<'original' | 'minimal' | 'vibrant' | 'luxury'>('original');
  const [showPreview, setShowPreview] = useState(false);

  const templates = [
    {
      id: 'original' as const,
      name: 'Original',
      description: 'Modern, conversion-optimized, professional',
      features: ['Comprehensive info', 'Multiple CTAs', 'Social proof stats'],
      bestFor: 'Maximum conversions',
      badge: 'Recommended',
      badgeColor: 'bg-green-500'
    },
    {
      id: 'minimal' as const,
      name: 'Minimal',
      description: 'Clean, modern, minimalist design',
      features: ['White space', 'Simple layout', 'Fast loading'],
      bestFor: 'Design-conscious users',
      badge: 'Fast',
      badgeColor: 'bg-blue-500'
    },
    {
      id: 'vibrant' as const,
      name: 'Vibrant',
      description: 'Bold, energetic with animations',
      features: ['Dark theme', 'Animated', 'Eye-catching'],
      bestFor: 'Younger audience',
      badge: 'Bold',
      badgeColor: 'bg-purple-500'
    },
    {
      id: 'luxury' as const,
      name: 'Luxury',
      description: 'Premium, elegant, high-end positioning',
      features: ['Serif fonts', 'Elegant spacing', 'Exclusive feel'],
      bestFor: 'Affluent audience',
      badge: 'Premium',
      badgeColor: 'bg-yellow-600'
    }
  ];

  if (showPreview) {
    switch (selectedTemplate) {
      case 'minimal':
        return <LandingPageMinimal onGetStarted={onGetStarted} />;
      case 'vibrant':
        return <LandingPageVibrant onGetStarted={onGetStarted} />;
      case 'luxury':
        return <LandingPageLuxury onGetStarted={onGetStarted} />;
      default:
        return <LandingPage onGetStarted={onGetStarted} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-[#BF94EA] to-[#FA7872] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">MM</span>
          </div>
          <h1 className="text-4xl font-bold text-[#01180B] mb-4">
            Choose Your Landing Page Style
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a template that best matches your brand personality and target audience. All templates maintain your brand colors and messaging.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all duration-300 ${
                selectedTemplate === template.id 
                  ? 'border-[#BF94EA] border-2 shadow-xl' 
                  : 'border-gray-200 hover:border-[#BF94EA]/50 hover:shadow-lg'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{template.name}</CardTitle>
                  <Badge className={`${template.badgeColor} text-white`}>
                    {template.badge}
                  </Badge>
                </div>
                <p className="text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="font-semibold text-sm text-gray-700">Features:</div>
                  <ul className="space-y-2">
                    {template.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <span className="mr-2 text-[#CDEDB2]">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Best for:</span> {template.bestFor}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <Button
            onClick={() => setShowPreview(true)}
            size="lg"
            className="bg-gradient-to-r from-[#BF94EA] to-[#FA7872] hover:opacity-90 text-white px-8 py-6 text-lg shadow-xl"
          >
            Preview {templates.find(t => t.id === selectedTemplate)?.name} Template
          </Button>
          
          <div className="text-sm text-gray-600">
            <p>Selected: <span className="font-semibold text-[#BF94EA]">{templates.find(t => t.id === selectedTemplate)?.name}</span></p>
            <p className="mt-2">To permanently switch templates, update the import in <code className="bg-gray-200 px-2 py-1 rounded text-xs">/App.tsx</code></p>
          </div>
        </div>

        {/* Implementation Guide */}
        <Card className="mt-12 border-[#CDEDB2] bg-[#CDEDB2]/10">
          <CardHeader>
            <CardTitle className="text-xl">💡 How to Switch Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">1. Open /App.tsx</p>
                <p className="text-sm text-gray-600">Find line 9 with the LandingPage import</p>
              </div>
              <div>
                <p className="font-semibold mb-2">2. Change the import:</p>
                <div className="bg-gray-900 text-white p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <div className="mb-2 text-gray-400">// Current:</div>
                  <div className="mb-4">import &#123; LandingPage &#125; from './components/landing-page';</div>
                  
                  <div className="mb-2 text-gray-400">// Change to one of:</div>
                  <div className="space-y-1">
                    <div className={selectedTemplate === 'original' ? 'text-[#CDEDB2]' : ''}>
                      import &#123; LandingPage &#125; from './components/landing-page';
                    </div>
                    <div className={selectedTemplate === 'minimal' ? 'text-[#CDEDB2]' : ''}>
                      import &#123; LandingPage &#125; from './components/landing-page-minimal';
                    </div>
                    <div className={selectedTemplate === 'vibrant' ? 'text-[#CDEDB2]' : ''}>
                      import &#123; LandingPage &#125; from './components/landing-page-vibrant';
                    </div>
                    <div className={selectedTemplate === 'luxury' ? 'text-[#CDEDB2]' : ''}>
                      import &#123; LandingPage &#125; from './components/landing-page-luxury';
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-2">3. Save and refresh</p>
                <p className="text-sm text-gray-600">Your new template will be active immediately!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
