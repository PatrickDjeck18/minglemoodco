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
            <p style="color: #01180B; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8;">Where meaningful connections begin</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #BF94EA;">
            <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Welcome to MingleMood, {{name}}! 👋</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Welcome to the community. Our curation team will review your profile within 10-14 days. Once approved, you will start receiving invitations to gathers curated exclusively for you.
            </p>
            
            <div style="background: #CDEDB2; border-left: 4px solid #01180B; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #01180B; margin: 0 0 15px 0; font-size: 18px;">✨ What's next:</h3>
              <ul style="color: #01180B; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Profile review (10-14 days)</li>
                <li>Please complete the personalized preference survey (mandatory for accurate matching)</li>
                <li>We will begin connecting you to exclusive events and activities with vetted Singles who match your preferences</li>
              </ul>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
              Questions? Contact us at <a href="mailto:hello@minglemood.co" style="color: #BF94EA; text-decoration: none;">hello@minglemood.co</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Not ready to mingle? <a href="{{unsubscribeLink}}" style="color: #6b7280; text-decoration: underline;">My bad, I'm not ready to Mingle. Please make my profile inactive and take me out of your database for now</a>
              </p>
            </div>
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
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #CDEDB2;">
            <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Congratulations, {{name}}! 🎊</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              Your MingleMood profile has been approved! Next step: Complete your personalization survey (5 minutes) to help us find your perfect matches and events.
            </p>
            
            <div style="background: #BF94EA; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <h3 style="color: #01180B; margin: 0 0 15px 0; font-size: 20px;">🎯 Complete Your Survey</h3>
              <a href="{{surveyLink}}" style="display: inline-block; background: #01180B; color: #BF94EA; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Take Survey Now →
              </a>
            </div>
            
            <div style="background: #CDEDB2; border-left: 4px solid #01180B; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <p style="color: #01180B; margin: 0; line-height: 1.6;">
                Once we find eligible Singles that fit your preferences, we will begin to send you invites to exclusive small group events (8-30 people). Make sure to mark our emails as "safe" to prevent them from going to spam and check your dashboard for updates.
              </p>
            </div>
            
            <p style="color: #6b7280; margin: 30px 0 0 0;">
              Looking forward to your first event.<br>
              <strong style="color: #01180B;">The MingleMood Team</strong>
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
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #BF94EA;">
            <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Hi {{name}}! 👋</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              We're excited to find you amazing matches! To make sure that we connect you with the <strong>right people and experiences</strong>, we need a bit more information about your preferences.
            </p>
            
            <div style="background: #FA7872; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">⏰ Survey Still Pending</h3>
              <p style="color: white; margin: 0 0 20px 0; line-height: 1.6;">
                Your personalization survey is waiting for you!
              </p>
              <a href="{{surveyLink}}" style="display: inline-block; background: white; color: #FA7872; text-decoration: none; padding: 18px 35px; border-radius: 10px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(247, 120, 114, 0.3);">
                Complete Survey Now! ✨
              </a>
            </div>
            
            <div style="background: #CDEDB2; border-left: 4px solid #01180B; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #01180B; margin: 0 0 15px 0; font-size: 18px;">This quick 5-minute survey helps us:</h3>
              <ul style="color: #01180B; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Connect you with compatible members</li>
                <li>Recommend experiences you'll love based on what you like to do</li>
                <li>Understand your interests and goals</li>
              </ul>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin: 25px 0;">
              The sooner you complete it, the sooner we can start finding your perfect matches.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{surveyLink}}" style="display: inline-block; background: #CDEDB2; color: #01180B; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Complete Your Survey →
              </a>
            </div>
            
            <p style="color: #6b7280; margin: 30px 0 0 0;">
              Looking forward to making great connections for you!<br>
              <strong style="color: #01180B;">The MingleMood Team</strong>
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
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E53A29;">
            <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Hi {{name}}! 👋</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
              We're excited to share some amazing events for you, but we need your preferences.
            </p>
            
            <div style="background: #E53A29; color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">⏰ Final Reminder</h3>
              <p style="color: white; margin: 0 0 20px 0; line-height: 1.6;">
                Please complete your survey to unlock the full MingleMood experience. It'll only take 5 minutes.
              </p>
              <a href="{{surveyLink}}" style="display: inline-block; background: white; color: #E53A29; text-decoration: none; padding: 18px 35px; border-radius: 10px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(229, 58, 41, 0.3);">
                Complete Now! ⚡
              </a>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin: 25px 0; text-align: center; font-weight: 600; color: #E53A29;">
              Don't let perfect matches slip away.
            </p>
            
            <p style="color: #6b7280; margin: 30px 0 0 0;">
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

  // ... rest of the component logic remains the same
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
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_email: testEmail,
          email_type: currentTemplate.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Test email sent to ${testEmail}!`);
      } else {
        alert(`❌ Failed to send test email: ${result.message}`);
      }
    } catch (error) {
      console.error('Test email error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSendingTest(false);
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

                    <Button 
                      onClick={handleSendTest}
                      disabled={!testEmail || sendingTest}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sendingTest ? 'Sending...' : 'Send Test Email'}
                    </Button>

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