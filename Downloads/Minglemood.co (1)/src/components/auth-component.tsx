import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import mingleMoodLogo from 'figma:asset/4a88fdb157e418b512a026cba9591d3ad406353f.png';
import { WhyMingleMood } from './why-minglemood';
import { HowItWorksComponent } from './how-it-works-component';

interface AuthComponentProps {
  onAuthSuccess: (user: any) => void;
}

export function AuthComponent({ onAuthSuccess }: AuthComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showWhyPage, setShowWhyPage] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    age: '',
    gender: '',
    location: '',
    profession: '',
    lookingFor: ''
  });

  // Check for password reset session on component mount
  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        // Ensure supabase client is available
        if (!supabase || !supabase.auth) {
          console.error('❌ Supabase client not available for password reset check');
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session for password reset:', error);
          return;
        }
        
        if (session && session.user && !session.user.email_confirmed_at) {
          console.log('🔐 Password reset session detected');
          setShowNewPasswordForm(true);
        }
      } catch (error) {
        console.error('Error checking password reset session:', error);
        // Don't show error to user - this is a background check
      }
    };

    checkPasswordResetSession();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        setSuccess('Successfully signed in!');
        setTimeout(() => onAuthSuccess(data.user), 500);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Provide helpful error messages
      if (error.message === 'Invalid login credentials') {
        setError('❌ Invalid email or password. Don\'t have an account? Click "Join MingleMood Social" to sign up!');
      } else if (error.message.includes('Email not confirmed')) {
        setError('❌ Please confirm your email address before signing in.');
      } else {
        setError(error.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name || !formData.phone || !formData.age || !formData.gender || 
        !formData.location || !formData.profession || !formData.lookingFor) {
      setError('Please fill in all fields to join our exclusive club.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          age: formData.age,
          gender: formData.gender,
          location: formData.location,
          profession: formData.profession,
          lookingFor: formData.lookingFor
        })
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to create account';
        
        // Try to parse error response as JSON, but handle non-JSON responses
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = await response.json();

      // Try to sign in the user after successful signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.warn('Signup successful but auto-signin failed:', signInError);
        // Don't throw - signup was successful, user can sign in manually
        setSuccess('Account created successfully! Please sign in with your credentials.');
        return;
      }

      if (signInData.user) {
        setSuccess('Welcome to MingleMood Social!');
        setTimeout(() => onAuthSuccess(signInData.user), 500);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(passwordResetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setPasswordResetSent(true);
      setSuccess('Password reset link sent! Please check your email.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Password updated successfully! You can now sign in.');
      setShowNewPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show Why MingleMood page if triggered
  if (showWhyPage) {
    return (
      <WhyMingleMood 
        onGetStarted={() => {
          setShowWhyPage(false);
          setShowAuth(true);
          setAuthMode('signup');
        }}
        onBack={() => setShowWhyPage(false)}
      />
    );
  }

  // Show How It Works page if triggered
  if (showHowItWorks) {
    return (
      <HowItWorksComponent
        onClose={() => setShowHowItWorks(false)}
        onGetStarted={() => {
          setShowHowItWorks(false);
          setShowAuth(true);
          setAuthMode('signup');
        }}
      />
    );
  }

  // Simple landing view (Raya-inspired)
  if (!showAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMSI+PHBhdGggZD0iTTM2IDE0aDEydjEySDM2ek0xNCAxNGgxMnYxMkgxNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        
        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <header className="py-6 px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <button 
                onClick={() => setShowWhyPage(true)}
                className="text-sm text-foreground hover:text-foreground/70 cursor-pointer font-medium tracking-wide transition-colors"
              >
                Why MingleMood
              </button>
              <button
                onClick={() => setShowHowItWorks(true)}
                className="text-sm text-foreground hover:text-foreground/70 cursor-pointer font-medium tracking-wide transition-colors"
              >
                How it works
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <div className="w-full max-w-3xl text-center">
              {/* Logo */}
              <div className="mb-12">
                <img 
                  src={mingleMoodLogo} 
                  alt="MingleMood" 
                  className="w-80 h-auto mx-auto object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(7%) sepia(18%) saturate(4532%) hue-rotate(183deg) brightness(96%) contrast(98%)' }}
                />
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground mb-8 leading-tight tracking-tight font-light">
                Stop Swiping,
                <br />
                <span className="font-normal">Start Connecting</span>
              </h1>

              {/* Subheadline */}
              <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                Skip the swiping, ghosting, and shallow matches. Make natural connections with compatible singles, vetted especially for you.
              </p>

              {/* CTA Button */}
              <Button 
                onClick={() => {
                  setShowAuth(true);
                  setAuthMode('signup');
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-lg sm:text-xl rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 font-medium tracking-wide"
              >
                Get Invited
              </Button>
            </div>
          </main>

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
      </div>
    );
  }

  // Auth forms (shown after clicking "Apply for Membership")
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => setShowAuth(false)} className="inline-block">
            <img 
              src={mingleMoodLogo} 
              alt="MingleMood" 
              className="w-32 h-auto mx-auto object-contain mb-6"
              style={{ filter: 'brightness(0) saturate(100%) invert(7%) sepia(18%) saturate(4532%) hue-rotate(183deg) brightness(96%) contrast(98%)' }}
            />
          </button>
          <h1 className="text-2xl font-medium text-foreground mb-2">
            {authMode === 'signin' ? 'Welcome Back' : 'Join MingleMood'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {authMode === 'signin' 
              ? 'Sign in to your account' 
              : 'Exclusive club for curated connections'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 space-y-3">
            <Alert className="border-destructive bg-destructive/10">
              <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
            </Alert>
            {error.includes('Invalid') && authMode === 'signin' && (
              <Alert className="border-blue-500 bg-blue-50">
                <AlertDescription className="text-blue-900 text-sm">
                  💡 <strong>Don't have an account?</strong> Click the <strong>"Join"</strong> tab above to create a new account first!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {success && (
          <Alert className="mb-6 border-chart-1 bg-accent/30">
            <AlertDescription className="text-foreground text-sm">{success}</AlertDescription>
          </Alert>
        )}

        {/* Auth Mode Toggle */}
        <div className="flex justify-center mb-8 border-b border-border">
          <button
            onClick={() => {
              setAuthMode('signin');
              setError('');
              setSuccess('');
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              authMode === 'signin'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setError('');
              setSuccess('');
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              authMode === 'signup'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Join
          </button>
        </div>

        {/* Sign In Form */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-sm text-foreground">Email</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-sm text-foreground">Password</Label>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              type="button"
              variant="outline" 
              onClick={handleGoogleSignIn} 
              className="w-full h-12 border-border hover:bg-secondary rounded-full" 
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </form>
        )}

        {/* Sign Up Form */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-sm text-foreground">Full Name</Label>
              <Input
                id="signup-name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm text-foreground">Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-phone" className="text-sm text-foreground">Phone</Label>
              <Input
                id="signup-phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-sm text-foreground">Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-age" className="text-sm text-foreground">Age</Label>
                <Input
                  id="signup-age"
                  name="age"
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="h-12 bg-white border-border focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-gender" className="text-sm text-foreground">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  required
                >
                  <SelectTrigger id="signup-gender" className="h-12 bg-white border-border">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-location" className="text-sm text-foreground">Location</Label>
              <Input
                id="signup-location"
                name="location"
                type="text"
                placeholder="City, State"
                value={formData.location}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-profession" className="text-sm text-foreground">Profession</Label>
              <Input
                id="signup-profession"
                name="profession"
                type="text"
                placeholder="Your profession"
                value={formData.profession}
                onChange={handleInputChange}
                className="h-12 bg-white border-border focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-looking-for" className="text-sm text-foreground">Looking For</Label>
              <Select
                value={formData.lookingFor}
                onValueChange={(value) => setFormData({ ...formData, lookingFor: value })}
                required
              >
                <SelectTrigger id="signup-looking-for" className="h-12 bg-white border-border">
                  <SelectValue placeholder="Select what you're looking for" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serious-relationship">Serious Relationship</SelectItem>
                  <SelectItem value="dating">Dating</SelectItem>
                  <SelectItem value="friendship">Friendship</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Join MingleMood'}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By joining, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        )}

        {/* Back to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAuth(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>

          {!passwordResetSent ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={passwordResetEmail}
                  onChange={(e) => setPasswordResetEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setPasswordResetEmail('');
                    setPasswordResetSent(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Password reset link sent! Please check your email.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => {
                  setShowPasswordReset(false);
                  setPasswordResetEmail('');
                  setPasswordResetSent(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Password Dialog */}
      <Dialog open={showNewPasswordForm} onOpenChange={setShowNewPasswordForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              Please enter your new password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}