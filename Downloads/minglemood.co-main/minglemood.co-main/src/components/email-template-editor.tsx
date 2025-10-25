import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Copy, RotateCcw, Mail, Palette, Type, Link2, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  description: string;
}

interface EmailTemplateEditorProps {
  user?: any;
}

export function EmailTemplateEditor({ user }: EmailTemplateEditorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<any>(null);
  const [checkingApiKey, setCheckingApiKey] = useState(false);

  // Updated email templates with your exact content
  const defaultTemplates: EmailTemplate[] = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to MingleMood! 🎉',
      description: 'Sent immediately when a user signs up',
      variables: ['name', 'unsubscribeLink'],
      text: `Welcome to MingleMood, {{name}}!

Welcome to the community. Our curation team will review your profile within 10-14 days. Once approved, you will start receiving invitations to gathers curated exclusively for you.

What's next:

* Profile review (10-14 days)
* Please complete the personalized preference survey (mandatory for accurate matching)
* We will begin connecting you to exclusive events and activities with vetted Singles who match your preferences

Questions? Contact us at hello@minglemood.co

Not ready to mingle? {{unsubscribeLink}}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
          <div style="background: #BF94EA; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px; position: relative;">
            <div style="background: #01180B; color: #BF94EA; padding: 12px 24px; border-radius: 30px; display: inline-block; font-size: 28px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px;">
              MingleMood
            </div>
            <h1 style="color: #01180B; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Our Community</h1>
            <p style="color: #01180B; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8;">Curated club for meaningful connections</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Welcome to MingleMood, {{name}}! 👋
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Welcome to the community. Our curation team will review your profile within 10-14 days. Once approved, you will start receiving invitations to gathers curated exclusively for you.
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              <strong>What's next:</strong>
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 8px; font-size: 16px;">
              • Profile review (10-14 days)
            </p>
            <p style="color: #374151; line-height: 1.7; margin-bottom: 8px; font-size: 16px;">
              • Please complete the personalized preference survey (mandatory for accurate matching)
            </p>
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              • We will begin connecting you to exclusive events and activities with vetted Singles who match your preferences
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Questions? Contact us at <a href="mailto:hello@minglemood.co" style="color: #BF94EA; text-decoration: none;">hello@minglemood.co</a>
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 0; font-size: 16px;">
              Not ready to mingle? <a href="{{unsubscribeLink}}" style="color: #BF94EA; text-decoration: none;">My bad, I'm not ready to Mingle. Please make my profile inactive and take me out of your database for now</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
          </div>
        </div>
      `
    },
    {
      id: 'profile_approved',
      name: 'Profile Approved',
      subject: '🎉 Your MingleMood profile has been approved!',
      description: 'Sent when admin approves a user profile',
      variables: ['name', 'surveyLink'],
      text: `Welcome to the community!
The MingleMood Team

Congratulations {{name}}! Your MingleMood profile has been approved!

Next step: Complete your personalization survey (5 minutes) to help us find your perfect matches and events.

Survey link: {{surveyLink}}

Once we find eligible Singles that fit your preferences, we will begin to send you invites to exclusive small group events (8-30 people). Make sure to mark our emails as "safe" to prevent them from going to spam and check your dashboard for updates.

Looking forward to your first event.
The MingleMood Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
          <div style="background: #CDEDB2; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
            <div style="background: #01180B; color: #CDEDB2; padding: 12px 24px; border-radius: 30px; display: inline-block; font-size: 28px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px;">
              MingleMood
            </div>
            <h1 style="color: #01180B; margin: 0; font-size: 28px; font-weight: 600;">Profile Approved! ✅</h1>
            <p style="color: #01180B; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8;">Welcome to the community!</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Welcome to the community!<br>
              The MingleMood Team
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Congratulations {{name}}! Your MingleMood profile has been approved!
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Next step: Complete your personalization survey (5 minutes) to help us find your perfect matches and events.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{surveyLink}}" style="display: inline-block; background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); color: white; text-decoration: none; padding: 18px 35px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(191, 148, 234, 0.4); transition: all 0.3s ease;">
                ✨ Complete Your Survey Now
              </a>
            </div>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Once we find eligible Singles that fit your preferences, we will begin to send you invites to exclusive small group events (8-30 people). Make sure to mark our emails as "safe" to prevent them from going to spam and check your dashboard for updates.
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 0; font-size: 16px;">
              Looking forward to your first event.<br>
              The MingleMood Team
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
          </div>
        </div>
      `
    },
    {
      id: 'survey_reminder_3day',
      name: 'Survey Reminder - 3 Days',
      subject: 'Complete your preferences for better matches',
      description: 'Sent 3 days after profile approval if survey not completed',
      variables: ['name', 'surveyLink'],
      text: `Complete Your Personalization Survey

Hi {{name}},

We're excited to find you amazing matches! To make sure that we connect you with the right people and experiences, we need a bit more information about your preferences.

Your personalization survey is still waiting for you: {{surveyLink}}

This quick 5-minute survey helps us:

Connect you with compatible members

Recommend experiences you'll love based on what you like to do

Understand your interests and goals

The sooner you complete it, the sooner we can start finding your perfect matches.

Complete your survey: {{surveyLink}}

Looking forward to making great connections for you!
The MingleMood Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
          <div style="background: #BF94EA; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
            <div style="background: #01180B; color: #BF94EA; padding: 12px 24px; border-radius: 30px; display: inline-block; font-size: 28px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px;">
              MingleMood
            </div>
            <h1 style="color: #01180B; margin: 0; font-size: 28px; font-weight: 600;">🎯 Complete Your Personalization Survey</h1>
            <p style="color: #01180B; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8;">Better matches await!</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Complete Your Personalization Survey
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Hi {{name}},
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              We're excited to find you amazing matches! To make sure that we connect you with the right people and experiences, we need a bit more information about your preferences.
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Your personalization survey is still waiting for you!
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              <strong>This quick 5-minute survey helps us:</strong>
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 8px; font-size: 16px;">
              Connect you with compatible members
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 8px; font-size: 16px;">
              Recommend experiences you'll love based on what you like to do
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Understand your interests and goals
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              The sooner you complete it, the sooner we can start finding your perfect matches.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{surveyLink}}" style="display: inline-block; background: linear-gradient(135deg, #BF94EA 0%, #CDEDB2 100%); color: #01180B; text-decoration: none; padding: 18px 35px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(191, 148, 234, 0.3); transition: all 0.3s ease;">
                🎯 Complete Survey Now
              </a>
            </div>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 0; font-size: 16px;">
              Looking forward to making great connections for you!<br>
              The MingleMood Team
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
          </div>
        </div>
      `
    },
    {
      id: 'survey_reminder_7day',
      name: 'Survey Reminder - 7 Days',
      subject: 'Don\'t Miss Out on Perfect Matches!',
      description: 'Sent 7 days after profile approval if survey not completed',
      variables: ['name', 'surveyLink'],
      text: `Don't Miss Out on Perfect Matches!

Hi {{name}},

We're excited to share some amazing events for you, but we need your preferences.

Your personalization survey is here: {{surveyLink}}

Please complete your survey to unlock the full MingleMood experience. It'll only take 5 minutes.

Complete now: {{surveyLink}}

Don't let perfect matches slip away.
The MingleMood Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
          <div style="background: #E53A29; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
            <div style="background: #01180B; color: #E53A29; padding: 12px 24px; border-radius: 30px; display: inline-block; font-size: 28px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px;">
              MingleMood
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">⚡ Don't Miss Out on Perfect Matches!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Final reminder to complete your survey</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Don't Miss Out on Perfect Matches!
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Hi {{name}},
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              We're excited to share some amazing events for you, but we need your preferences.
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Please complete your survey to unlock the full MingleMood experience. It'll only take 5 minutes.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{surveyLink}}" style="display: inline-block; background: linear-gradient(135deg, #E53A29 0%, #FA7872 100%); color: white; text-decoration: none; padding: 20px 40px; border-radius: 12px; font-weight: 700; font-size: 19px; box-shadow: 0 4px 20px rgba(229, 58, 41, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚡ Complete Now - Don't Miss Out!
              </a>
            </div>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Don't let perfect matches slip away.
            </p>
            
            <p style="color: #374151; line-height: 1.7; margin-bottom: 0; font-size: 16px;">
              The MingleMood Team
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
          </div>
        </div>
      `
    },
    {
      id: 'event_invitation',
      name: 'Event Invitation',
      subject: '✨ You\'re invited: {{eventTitle}}',
      description: 'Sent when inviting users to events',
      variables: ['name', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'cost', 'details', 'rsvpLink'],
      text: `You're invited to {{eventTitle}}!

Hi {{name}},

You've been personally selected for this exclusive MingleMood event.

Event Details:
📅 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: {{eventLocation}}
💰 Cost: {{cost}}

About this event:
{{details}}

⏰ IMPORTANT: You have 7 days to RSVP or your spot will be released.

RSVP: {{rsvpLink}}

This invitation is private and exclusive to you.

We can't wait to see you there!
The MingleMood Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
          <div style="background: #BF94EA; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
            <div style="background: #01180B; color: #BF94EA; padding: 12px 24px; border-radius: 30px; display: inline-block; font-size: 28px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px;">
              MingleMood
            </div>
            <h1 style="color: #01180B; margin: 0; font-size: 28px; font-weight: 600;">You're Invited! ✨</h1>
            <p style="color: #01180B; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8;">An exclusive MingleMood event</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #BF94EA;">
            <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Hi {{name}}! 👋</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              You've been personally selected for this exclusive MingleMood event based on your preferences and profile.
            </p>
            
            <div style="background: #f9fafb; border: 2px solid #BF94EA; padding: 25px; border-radius: 12px; margin: 25px 0;">
              <h3 style="color: #01180B; margin: 0 0 20px 0; font-size: 24px; text-align: center;">{{eventTitle}}</h3>
              
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; color: #374151;">
                  <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">📅 Date:</span>
                  <span>{{eventDate}}</span>
                </div>
                <div style="display: flex; align-items: center; color: #374151;">
                  <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">🕐 Time:</span>
                  <span>{{eventTime}}</span>
                </div>
                <div style="display: flex; align-items: center; color: #374151;">
                  <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">📍 Location:</span>
                  <span>{{eventLocation}}</span>
                </div>
                <div style="display: flex; align-items: center; color: #374151;">
                  <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">💰 Cost:</span>
                  <span>{{cost}}</span>
                </div>
              </div>
              
              <div style="text-align: center; background: #01180B; color: #BF94EA; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-weight: 600; font-size: 16px;">
                  ⏰ <strong>7 days left</strong> to secure your spot
                </p>
              </div>
            </div>
            
            <div style="background: #CDEDB2; border-left: 4px solid #01180B; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #01180B; margin: 0 0 15px 0; font-size: 18px;">✨ About this event:</h3>
              <p style="color: #01180B; margin: 0; line-height: 1.6;">{{details}}</p>
            </div>
            
            <div style="background: #FA7872; background: linear-gradient(135deg, #FA7872 0%, #E53A29 100%); color: white; padding: 20px; margin: 25px 0; border-radius: 12px;">
              <h3 style="color: white; margin: 0 0 10px 0; font-size: 16px;">⏰ RSVP Required</h3>
              <p style="color: white; margin: 0; line-height: 1.6;">You have <strong>7 days</strong> to RSVP or your spot will be released to the waitlist.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{rsvpLink}}" style="display: inline-block; background: #CDEDB2; color: #01180B; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 18px; margin-right: 15px; box-shadow: 0 4px 12px rgba(205, 237, 178, 0.3);">
                RSVP Yes! 🎉
              </a>
              <a href="{{rsvpLink}}?response=no" style="display: inline-block; background: #6b7280; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Can't Make It
              </a>
            </div>
            
            <p style="color: #6b7280; margin: 30px 0 0 0;">
              We can't wait to see you there!<br>
              <strong style="color: #01180B;">The MingleMood Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
          </div>
        </div>
      `
    }
  ];

  useEffect(() => {
    setTemplates(defaultTemplates);
    if (defaultTemplates.length > 0) {
      setSelectedTemplate(defaultTemplates[0].id);
      setCurrentTemplate(defaultTemplates[0]);
    }
    setLoading(false);
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCurrentTemplate(template);
      setPreviewData({});
    }
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    
    setSaving(true);
    try {
      // Update the template in the state
      setTemplates(prev => 
        prev.map(t => 
          t.id === currentTemplate.id ? currentTemplate : t
        )
      );
      
      console.log('Template saved:', currentTemplate);
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !currentTemplate) return;
    
    setSendingTest(true);
    try {
      // Get the user's access token for admin authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('❌ Authentication required. Please sign in again.');
        return;
      }

      console.log('📧 Sending test email for template:', currentTemplate.id, 'to:', testEmail);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/test-email-clean`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_email: testEmail,
          email_type: currentTemplate.id
        })
      });

      console.log('📧 Test email response status:', response.status);
      console.log('📧 Test email response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Test email failed with status:', response.status, 'Error:', errorText);
        alert(`❌ Server error (${response.status}): ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('📧 Test email result:', result);
      
      if (result.success) {
        alert(`✅ Test email sent successfully to ${testEmail}! Check your inbox.`);
      } else {
        alert(`❌ Failed to send test email: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Test email error:', error);
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        alert(`❌ Server returned invalid response. Check console for details. This usually means the server endpoint is not working properly.`);
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } finally {
      setSendingTest(false);
    }
  };

  const checkApiKey = async () => {
    setCheckingApiKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('❌ Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/check-api-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setApiKeyStatus(result);
      
      if (result.has_api_key) {
        if (result.format_looks_correct) {
          alert(`✅ API Key Status: ${result.message}\n\nKey Preview: ${result.key_preview}\nLength: ${result.key_length} characters`);
        } else {
          alert(`⚠️ API Key Issues Found:\n\n${result.message}\n\nKey Preview: ${result.key_preview}\nLength: ${result.key_length} characters\nStarts with "re_": ${result.starts_with_re}`);
        }
      } else {
        alert(`❌ No API Key Found:\n\n${result.message}\n\nPlease set your RESEND_API_KEY environment variable.`);
      }
    } catch (error) {
      console.error('❌ API key check error:', error);
      alert(`❌ Error checking API key: ${error.message}`);
    } finally {
      setCheckingApiKey(false);
    }
  };

  const generatePreview = () => {
    if (!currentTemplate) return '';
    
    let html = currentTemplate.html;
    
    // Replace variables with preview data or defaults
    currentTemplate.variables.forEach(variable => {
      const value = previewData[variable] || `{{${variable}}}`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      html = html.replace(regex, value);
    });
    
    return html;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Email Template Editor</h2>
          <p className="text-gray-600">Customize your MingleMood email templates</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave} disabled={saving || !currentTemplate}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-[#BF94EA] bg-[#BF94EA]/10'
                      : 'border-gray-200 hover:border-[#BF94EA]/50'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {currentTemplate && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="test">Test</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{currentTemplate.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={currentTemplate.subject}
                        onChange={(e) => setCurrentTemplate({
                          ...currentTemplate,
                          subject: e.target.value
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="text">Plain Text Version</Label>
                      <Textarea
                        id="text"
                        value={currentTemplate.text}
                        onChange={(e) => setCurrentTemplate({
                          ...currentTemplate,
                          text: e.target.value
                        })}
                        rows={10}
                      />
                    </div>

                    <div>
                      <Label htmlFor="html">HTML Version</Label>
                      <Textarea
                        id="html"
                        value={currentTemplate.html}
                        onChange={(e) => setCurrentTemplate({
                          ...currentTemplate,
                          html: e.target.value
                        })}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-4">
                      <h4 className="font-medium">Preview Data</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {currentTemplate.variables.map((variable) => (
                          <div key={variable}>
                            <Label htmlFor={variable}>{variable}</Label>
                            <Input
                              id={variable}
                              placeholder={`Enter ${variable}...`}
                              value={previewData[variable] || ''}
                              onChange={(e) => setPreviewData(prev => ({
                                ...prev,
                                [variable]: e.target.value
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-white">
                      <div 
                        dangerouslySetInnerHTML={{ __html: generatePreview() }}
                        className="prose max-w-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Test Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="testEmail">Test Email Address</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter email address to test..."
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleSendTest}
                        disabled={!testEmail || sendingTest}
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {sendingTest ? 'Sending...' : 'Send Test Email'}
                      </Button>
                      
                      <Button 
                        onClick={checkApiKey}
                        disabled={checkingApiKey}
                        variant="outline"
                        size="sm"
                      >
                        {checkingApiKey ? 'Checking...' : 'Check API Key'}
                      </Button>
                    </div>

                    <Alert>
                      <AlertDescription>
                        This will send a test email using the current template content.
                        Make sure to save your changes first if you want to test the latest version.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}