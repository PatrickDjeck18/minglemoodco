import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MessageCircle, Bell, Settings, FileText, Mail, Menu, Info, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "./components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { supabase } from "./utils/supabase/client";
import { projectId } from "./utils/supabase/info";
import { AuthComponent } from "./components/auth-component";
import { ProfileSetupComponent } from "./components/profile-setup-component";
import { EventsComponent } from "./components/events-component";
import { SubscriptionComponent } from "./components/subscription-component";
import { ThankYouComponent } from "./components/thank-you-component";
import { PreferencesSurvey } from "./components/preferences-survey";
import { AdminDashboard } from "./components/admin-dashboard";
import { EmailFunnelManager } from "./components/email-funnel-manager";
import { WhyMingleMood } from "./components/why-minglemood";
import { HowItWorksComponent } from "./components/how-it-works-component";
import { ErrorBoundary } from "./components/error-boundary";

export default function App() {
  const [activeTab, setActiveTab] = useState("events");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWhyMinglemood, setShowWhyMinglemood] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Navigation must be defined before any early returns to satisfy Rules of Hooks
  const navigation = useMemo(() => {
    const baseNavigation = [
      { id: "events", label: "Events", icon: Calendar },
      {
        id: "messages",
        label: "Messages",
        icon: MessageCircle,
      },
      { id: "subscription", label: "Membership", icon: Bell },
      { id: "profile", label: "My Profile", icon: Settings },
    ];

    // Create a copy to avoid mutation
    const nav = [...baseNavigation];

    // Add survey option if not completed
    if (!surveyCompleted) {
      nav.splice(2, 0, {
        id: "survey",
        label: "Preferences Survey",
        icon: FileText,
      });
    }

    if (isAdmin) {
      nav.push({ id: "admin", label: "Admin", icon: Settings });
      nav.push({
        id: "email-funnel",
        label: "Email Funnel",
        icon: Mail,
      });
    }

    return nav;
  }, [surveyCompleted, isAdmin]);

  const handleSignOut = async () => {
    try {
      console.log("🚪 Signing out user...");
      await supabase.auth.signOut();

      // Clear all local state
      setUser(null);
      setIsAdmin(false);
      setProfileComplete(false);
      setShowThankYou(false);
      setSurveyCompleted(false);
      setShowSurvey(false);
      setActiveTab("events");
      setMobileMenuOpen(false);

      // Clear any cached auth data
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("supabase.auth.token");

      console.log("✅ Sign out complete");
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if sign out fails, clear local state
      setUser(null);
      setIsAdmin(false);
      setProfileComplete(false);
      setShowThankYou(false);
      setSurveyCompleted(false);
      setShowSurvey(false);
      setActiveTab("events");
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listen for unhandled promise rejections that might be auth-related
    const handleUnhandledRejection = (
      event: PromiseRejectionEvent,
    ) => {
      if (
        event.reason?.message?.includes(
          "refresh_token_not_found",
        ) ||
        event.reason?.message?.includes("Invalid Refresh Token")
      ) {
        console.log(
          "🔄 Unhandled auth error detected, clearing session...",
        );
        event.preventDefault(); // Prevent the error from showing in console
        handleSignOut();
      } else if (
        event.reason?.message?.includes("Failed to fetch") ||
        event.reason instanceof TypeError
      ) {
        console.log(
          "🌐 Network/Server error detected - Edge Function may not be deployed",
          event.reason
        );
        // Don't prevent - let it log for debugging
      }
    };

    window.addEventListener(
      "unhandledrejection",
      handleUnhandledRejection,
    );

    // Clear any old demo data from localStorage/cache
    const clearDemoData = () => {
      try {
        // Clear old demo data that might still be cached
        localStorage.removeItem("sample_profiles");
        localStorage.removeItem("demo_events");
        localStorage.removeItem("sample_matches");
        localStorage.removeItem("minglemood_cached_events");
        localStorage.removeItem("minglemood_demo_data");
        localStorage.removeItem("demo_photos");
        localStorage.removeItem("placeholder_images");
        localStorage.removeItem("stock_photos");

        // Clear any IndexedDB demo data if present
        if (typeof window !== "undefined" && window.indexedDB) {
          try {
            indexedDB.deleteDatabase("demo_photos");
            indexedDB.deleteDatabase("placeholder_data");
          } catch (idbError) {
            console.log("IndexedDB clear failed:", idbError);
          }
        }

        console.log(
          "🧹 Cleared old demo data from cache and storage",
        );
      } catch (error) {
        console.log("Cache clear failed:", error);
      }
    };

    clearDemoData();

    // Check for existing session with proper error handling
    const checkSession = async () => {
      try {
        console.log('🔍 Checking session...');
        
        // Validate supabase client before using
        if (!supabase || !supabase.auth) {
          console.error('❌ Supabase client not available');
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Handle auth errors (like invalid refresh token)
        if (error) {
          console.log("Auth session error:", error.message);
          if (
            error.message.includes("refresh_token_not_found") ||
            error.message.includes("Invalid Refresh Token") ||
            error.message.includes("refresh token not found")
          ) {
            // Clear the invalid session
            console.log(
              "🔄 Clearing invalid session and signing out...",
            );
            await supabase.auth.signOut();
            setUser(null);
            setIsAdmin(false);
            setProfileComplete(false);
            setShowThankYou(false);
            setSurveyCompleted(false);
            setLoading(false);
            return;
          }
        }

        if (isMounted && session?.user) {
          console.log('✅ Session found, user authenticated');
          setUser(session.user);
          // Check if user is admin - hello@minglemood.co and mutemela72@gmail.com have admin access
          const isUserAdmin =
            session.user.email === "hello@minglemood.co" || 
            session.user.email === "mutemela72@gmail.com";
          setIsAdmin(isUserAdmin);

          // Check if profile is complete (in a real app, you'd check this from the database)
          // For demo purposes, we'll check if they have profile_complete in metadata
          setProfileComplete(
            session.user.user_metadata?.profile_complete ===
              true,
          );
          setShowThankYou(
            session.user.user_metadata?.profile_complete ===
              true &&
              !session.user.user_metadata?.thank_you_seen,
          );
          setSurveyCompleted(
            session.user.user_metadata?.survey_completed ===
              true,
          );
          setLoading(false);
        } else if (isMounted) {
          console.log('ℹ️ No session found, showing auth page');
          // No valid session found
          setUser(null);
          setIsAdmin(false);
          setProfileComplete(false);
          setShowThankYou(false);
          setSurveyCompleted(false);
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Session check error:", error);
        
        // Just set loading to false and continue
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes with error handling
    let subscription: any = null;
    
    try {
      if (supabase && supabase.auth) {
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;

          console.log(
            "🔐 Auth state change:",
            event,
            session ? "session exists" : "no session",
          );

          // Handle specific auth events
          if (event === "TOKEN_REFRESHED") {
            console.log("✅ Token refreshed successfully");
          } else if (event === "SIGNED_OUT") {
            console.log("👋 User signed out");
          } else if (event === "SIGNED_IN") {
            console.log("🎉 User signed in");
            setLoading(false);
          }

          if (session?.user) {
            setUser(session.user);
            // Check if user is admin - hello@minglemood.co and mutemela72@gmail.com have admin access
            const isUserAdmin =
              session.user.email === "hello@minglemood.co" || 
              session.user.email === "mutemela72@gmail.com";
            setIsAdmin(isUserAdmin);
            setProfileComplete(
              session.user.user_metadata?.profile_complete === true,
            );
            setShowThankYou(
              session.user.user_metadata?.profile_complete ===
                true && !session.user.user_metadata?.thank_you_seen,
            );
            setSurveyCompleted(
              session.user.user_metadata?.survey_completed === true,
            );
          } else {
            // Clear all user state when no session
            setUser(null);
            setIsAdmin(false);
            setProfileComplete(false);
            setShowThankYou(false);
            setSurveyCompleted(false);
          }
        });
        
        subscription = authSubscription;
      } else {
        console.error('❌ Cannot setup auth listener - supabase client not available');
      }
    } catch (error) {
      console.error('❌ Error setting up auth state listener:', error);
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // Handle URL-based survey access
  useEffect(() => {
    const urlParams = new URLSearchParams(
      window.location.search,
    );
    if (
      urlParams.get("survey") === "true" &&
      profileComplete &&
      !surveyCompleted
    ) {
      setShowSurvey(true);
    }
  }, [profileComplete, surveyCompleted]);

  // Set default tab to something other than profiles if profile is complete
  useEffect(() => {
    if (profileComplete && activeTab === "profiles") {
      setActiveTab("events");
    }
  }, [profileComplete, activeTab]);

  const handleProfileComplete = async (profileData: any) => {
    try {
      console.log("🎉 Profile completed! Saving data");
      
      // Validate supabase client
      if (!supabase || !supabase.auth) {
        console.error("Supabase client not available");
        alert("Unable to save profile at this time. Please refresh the page and try again.");
        return;
      }
      
      console.log("✅ Supabase client validated, calling updateUser");
      
      // Update user metadata with profile completion
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: {
          profile_complete: true,
          profile_data: profileData,
          thank_you_seen: false, // Show thank you page
        },
      });
      
      console.log("✅ updateUser call completed", { hasError: !!error });

      if (error) {
        console.error("Error updating profile completion status", error);

        // Check if this is an auth error that requires sign out
        if (
          error.message?.includes("refresh_token_not_found") ||
          error.message?.includes("Invalid Refresh Token")
        ) {
          console.log("🔄 Auth error during profile update, signing out");
          await handleSignOut();
          return;
        }

        alert(
          "There was an error saving your profile. Please try again. Error: " + error.message,
        );
        return;
      }

      console.log("✅ Profile metadata updated successfully");
      
      // Update local state to trigger Thank You page
      console.log("📱 Setting state: profileComplete=true, showThankYou=true");
      setProfileComplete(true);
      setShowThankYou(true);
      
      // Update user object in state
      if (updatedUser?.user) {
        console.log("👤 Updating user state with new metadata");
        setUser(updatedUser.user);
      }

      // Trigger profile completion email (optional - don't fail if this doesn't work)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          const emailResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/profile-completed`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user?.id,
                email: user?.email,
                name: profileData.name || user?.email,
              }),
            },
          );
          
          if (emailResponse.ok) {
            console.log("✅ Profile completion email triggered");
          } else {
            console.log("⚠️ Profile completion email failed but profile saved successfully");
          }
        }
      } catch (emailError) {
        console.error(
          "❌ Failed to trigger profile completion email:",
          emailError,
        );
        // Don't show error to user since profile save succeeded
        console.log("⚠️ Email notification failed, but profile was saved successfully");
      }
      
      console.log("🎊 Profile completion flow finished - Thank You page should show now");
    } catch (error) {
      console.error(
        "❌ Unexpected error in handleProfileComplete:",
        error,
      );
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(
        "There was an error saving your profile: " + errorMessage + "\n\nPlease try again or contact support at hello@minglemood.co",
      );
    }
  };

  const handleThankYouContinue = async () => {
    try {
      console.log("👋 User clicked Continue from Thank You page");
      
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: {
          profile_complete: true,
          thank_you_seen: true,
        },
      });
      
      if (!error) {
        console.log("✅ Updated thank_you_seen to true");
        setShowThankYou(false);
        
        // Update user state with new metadata
        if (updatedUser?.user) {
          setUser(updatedUser.user);
        }
        
        console.log("📱 Navigating to main dashboard");
      } else {
        console.error(
          "❌ Error updating thank you status:",
          error,
        );

        // Check if this is an auth error that requires sign out
        if (
          error.message?.includes("refresh_token_not_found") ||
          error.message?.includes("Invalid Refresh Token")
        ) {
          console.log(
            "🔄 Auth error during thank you update, signing out...",
          );
          await handleSignOut();
          return;
        }

        // Continue anyway even if update fails
        setShowThankYou(false);
      }
    } catch (error) {
      console.error("❌ Unexpected error in handleThankYouContinue:", error);
      setShowThankYou(false); // Continue anyway
    }
  };

  const handleSurveyComplete = async (surveyData: any) => {
    try {
      console.log("Survey data:", surveyData);

      const { error } = await supabase.auth.updateUser({
        data: {
          ...user?.user_metadata,
          survey_completed: true,
          survey_data: surveyData,
          survey_completed_at: new Date().toISOString(),
        },
      });

      if (error) {
        console.error("Error saving survey:", error);

        // Check if this is an auth error that requires sign out
        if (
          error.message?.includes("refresh_token_not_found") ||
          error.message?.includes("Invalid Refresh Token")
        ) {
          console.log(
            "🔄 Auth error during survey save, signing out...",
          );
          await handleSignOut();
          return;
        }

        alert(
          "There was an error saving your survey. Please try again.",
        );
        return;
      }

      setSurveyCompleted(true);
      setShowSurvey(false);
      setActiveTab("events"); // Redirect to events since survey tab will disappear

      // Trigger survey completion notification
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-4bcc747c/survey-completed`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user?.id,
                email: user?.email,
                name:
                  user?.user_metadata?.profile_data?.name ||
                  user?.email,
              }),
            },
          );
          console.log(
            "✅ Survey completion notification sent",
          );
        }
      } catch (emailError) {
        console.error(
          "❌ Failed to trigger survey completion notification:",
          emailError,
        );
      }

      alert(
        "🎉 Survey completed! Thank you for helping us find your perfect matches. You'll start receiving personalized event invitations soon!",
      );
    } catch (error) {
      console.error("Error saving survey:", error);
      alert(
        "There was an error saving your survey. Please try again.",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-2xl text-primary-foreground">
            MM
          </span>
        </div>
        <h1 className="mb-4 text-center">
          MingleMood Social
        </h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Exclusive club for curated connections
        </p>
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground text-center">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthComponent onAuthSuccess={(user) => setUser(user)} />
    );
  }

  // Show profile setup if user hasn't completed their profile
  if (!profileComplete) {
    console.log("🔧 Rendering: ProfileSetupComponent (profileComplete=false)");
    return (
      <ErrorBoundary>
        <ProfileSetupComponent
          user={user}
          onProfileComplete={handleProfileComplete}
        />
      </ErrorBoundary>
    );
  }

  // Show thank you page after profile completion
  if (showThankYou) {
    console.log("🎉 Rendering: ThankYouComponent (showThankYou=true)");
    return (
      <ThankYouComponent
        user={user}
        onContinue={handleThankYouContinue}
      />
    );
  }
  
  console.log("📱 Rendering: Main Dashboard (profileComplete=true, showThankYou=false)");

  // Show preferences survey if triggered
  if (showSurvey) {
    return (
      <PreferencesSurvey
        user={user}
        onComplete={handleSurveyComplete}
        onCancel={() => setShowSurvey(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl text-primary-foreground">
                  MM
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl truncate">
                  MingleMood Social
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
                  Exclusive club for curated connections
                </p>
              </div>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                onClick={() => setShowWhyMinglemood(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                Why Minglemood
              </Button>
              <Button
                onClick={() => setShowHowItWorks(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                How it Works
              </Button>
              
              {/* Desktop Sign Out - Hidden on mobile, visible on medium+ screens */}
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative"
                  >
                    <Menu className="h-5 w-5" />
                    {!surveyCompleted && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></div>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 sm:w-96"
                >
                  {/* Accessibility: Hidden title and description for screen readers */}
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>
                      Access your profile, events, messages, and
                      other features
                    </SheetDescription>
                  </SheetHeader>

                  {/* Mobile User Info */}
                  <div className="flex items-center space-x-4 p-6 border-b border-border mb-6 bg-secondary rounded-lg">
                    {user?.user_metadata?.profile_data?.photos?.[0] ? (
                      <img
                        src={
                          user.user_metadata.profile_data
                            .photos[0]
                        }
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover border-3 border-white shadow-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl shadow-lg">
                        {user?.user_metadata?.profile_data?.name?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-lg">
                        {user?.user_metadata?.profile_data
                          ?.name || "Profile Setup Needed"}
                      </span>
                      {isAdmin && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-1 mt-2 w-fit bg-accent text-accent-foreground border-chart-1"
                        >
                          👑 Admin Access
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex flex-col space-y-3 px-2">
                    {navigation.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === "survey") {
                            setShowSurvey(true);
                            setMobileMenuOpen(false);
                          } else {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={`flex items-center space-x-4 px-4 py-4 rounded-xl text-base transition-all touch-manipulation ${
                          activeTab === item.id
                            ? "bg-secondary text-foreground shadow-sm border-2 border-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-2 border-transparent"
                        } ${item.id === "survey" ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md border-0" : ""}`}
                      >
                        <item.icon className="h-6 w-6 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>
                        {item.id === "survey" &&
                          !surveyCompleted && (
                            <Badge className="bg-accent text-accent-foreground text-xs px-2 py-1">
                              New!
                            </Badge>
                          )}
                      </button>
                    ))}
                  </div>

                  {/* Mobile Info Buttons */}
                  <div className="mt-6 px-2 space-y-2">
                    <Button
                      onClick={() => {
                        setShowWhyMinglemood(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full py-3 text-base touch-manipulation"
                    >
                      Why Minglemood
                    </Button>
                    <Button
                      onClick={() => {
                        setShowHowItWorks(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full py-3 text-base touch-manipulation"
                    >
                      How it Works
                    </Button>
                  </div>

                  {/* Mobile Sign Out - Prominent */}
                  <div className="mt-6 px-2">
                    <Button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full py-4 text-base font-medium touch-manipulation flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </Button>
                  </div>

                  {/* App Info Footer - Fixed positioning removed */}
                  <div className="mt-8 px-2 pt-6 border-t border-border">
                    <div className="text-xs text-muted-foreground space-y-1 text-center pb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground">
                            MM
                          </span>
                        </div>
                        <span className="text-foreground">
                          MingleMood Social
                        </span>
                      </div>
                      <p>
                        Exclusive club for curated connections
                      </p>
                      <p className="text-foreground">
                        <a
                          href="mailto:hello@minglemood.co"
                          className="text-primary hover:underline"
                        >
                          hello@minglemood.co
                        </a>
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Why Minglemood Dialog */}
      <Dialog open={showWhyMinglemood} onOpenChange={setShowWhyMinglemood}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Why Minglemood</DialogTitle>
            <DialogDescription>
              Learn about what makes Minglemood special
            </DialogDescription>
          </DialogHeader>
          <WhyMingleMood 
            onGetStarted={() => setShowWhyMinglemood(false)}
            onBack={() => setShowWhyMinglemood(false)}
          />
        </DialogContent>
      </Dialog>

      {/* How it Works Dialog */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>How it Works</DialogTitle>
            <DialogDescription>
              Learn how to get started with Minglemood
            </DialogDescription>
          </DialogHeader>
          <HowItWorksComponent />
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Survey Reminder Notice */}
        {profileComplete && !surveyCompleted && (
          <Alert className="mb-4 sm:mb-6 border-accent bg-secondary">
            <FileText className="h-4 w-4 text-foreground mt-1 flex-shrink-0" />
            <AlertDescription className="text-foreground">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex-1">
                  <strong className="block sm:inline">
                    Complete Your Preferences Survey:
                  </strong>
                  <span className="block sm:inline sm:ml-1">
                    Help us find your perfect matches by
                    completing your personalization survey! It
                    only takes 5 minutes and unlocks better
                    event recommendations.
                  </span>
                </div>
                <div className="flex">
                  <Button
                    size="sm"
                    onClick={() => setShowSurvey(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground touch-manipulation w-full sm:w-auto"
                  >
                    Take Survey Now
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Privacy Notice for Completed Profiles */}
        {profileComplete && (
          <Alert className="mb-4 sm:mb-6 border-chart-1 bg-accent/30">
            <Info className="h-4 w-4 text-chart-1 mt-1 flex-shrink-0" />
            <AlertDescription className="text-foreground">
              <div>
                <span>
                  <strong>Privacy Protected:</strong> Your
                  profile is complete and secure. Member
                  profiles are kept private for exclusive,
                  curated matching.
                  {surveyCompleted && (
                    <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                      ✨ Survey completed - you'll receive
                      personalized invitations!
                    </span>
                  )}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {activeTab === "events" && (
          <EventsComponent user={user} />
        )}
        {activeTab === "messages" && (
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Messaging feature coming soon...
              </p>
            </CardContent>
          </Card>
        )}
        {activeTab === "subscription" && (
          <SubscriptionComponent user={user} />
        )}
        {activeTab === "profile" && (
          <ProfileSetupComponent
            user={user}
            onProfileComplete={async (profileData) => {
              try {
                console.log('📝 Updating profile with data:', profileData);
                
                // Save updated profile data - ensure we keep ALL existing metadata
                const updatedMetadata = {
                  ...user?.user_metadata,
                  profile_data: profileData,
                  profile_complete: true, // Ensure this stays true
                };
                
                console.log('📤 Sending to Supabase:', updatedMetadata);
                
                const { data, error } =
                  await supabase.auth.updateUser({
                    data: updatedMetadata,
                  });

                if (error) {
                  console.error(
                    "❌ Supabase error updating profile:",
                    error,
                    "Error code:",
                    error.status,
                    "Error message:",
                    error.message
                  );
                  
                  // Check if this is an auth error that requires sign out
                  if (
                    error.message?.includes("refresh_token_not_found") ||
                    error.message?.includes("Invalid Refresh Token")
                  ) {
                    console.log(
                      "🔄 Auth error during profile update, signing out...",
                    );
                    await handleSignOut();
                    return;
                  }
                  
                  alert(
                    `There was an error updating your profile. Please try again.\n\nError: ${error.message || 'Unknown error'}`,
                  );
                } else {
                  console.log('✅ Profile update successful!', data);
                  alert("✅ Profile updated successfully!");
                  
                  // Refresh user data to show updates immediately
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user) {
                    console.log('🔄 Refreshed user session:', session.user);
                    setUser(session.user);
                  }
                }
              } catch (error: any) {
                console.error("❌ Unexpected error updating profile:", error);
                console.error("Error details:", {
                  message: error?.message,
                  stack: error?.stack,
                  name: error?.name
                });
                alert(
                  `There was an unexpected error updating your profile. Please try again.\n\nError: ${error?.message || 'Unknown error'}`,
                );
              }
            }}
          />
        )}
        {activeTab === "admin" && isAdmin && (
          <AdminDashboard user={user} />
        )}
        {activeTab === "email-funnel" && isAdmin && (
          <EmailFunnelManager user={user} />
        )}

        {/* Footer with Contact Info */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm text-primary-foreground">MM</span>
              </div>
              <span className="text-sm text-foreground">MingleMood Social</span>
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
            <p className="text-xs text-muted-foreground">
              © 2024 MingleMood. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}