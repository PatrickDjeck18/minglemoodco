/**
 * Google Analytics 4 Utility
 * 
 * Centralized analytics tracking for MingleMood Social
 * Tracks user interactions, conversions, and behavior
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize Google Analytics 4
 * Call this once when the app loads
 */
export const initGA = (measurementId: string) => {
  if (typeof window === 'undefined') return;

  // Check if gtag is already loaded
  if (window.gtag) {
    console.log('✅ Google Analytics already initialized');
    return;
  }

  // Create script element for gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  // Configure GA4
  window.gtag('config', measurementId, {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  console.log('✅ Google Analytics 4 initialized:', measurementId);
};

/**
 * Track page views
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });

  console.log('📊 Page view tracked:', pagePath);
};

/**
 * Track custom events
 */
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (!window.gtag) return;

  window.gtag('event', eventName, parameters);
  console.log('📊 Event tracked:', eventName, parameters);
};

/**
 * User Authentication Events
 */
export const analytics = {
  // Sign Up Events
  signUpStarted: (method: 'email' | 'google' | 'facebook' = 'email') => {
    trackEvent('sign_up_started', {
      method,
      timestamp: new Date().toISOString(),
    });
  },

  signUpCompleted: (userId: string, method: 'email' | 'google' | 'facebook' = 'email') => {
    trackEvent('sign_up', {
      method,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Login Events
  loginStarted: (method: 'email' | 'google' | 'facebook' = 'email') => {
    trackEvent('login_started', {
      method,
      timestamp: new Date().toISOString(),
    });
  },

  loginCompleted: (userId: string, method: 'email' | 'google' | 'facebook' = 'email') => {
    trackEvent('login', {
      method,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  },

  logout: (userId: string) => {
    trackEvent('logout', {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Profile Events
  profileSetupStarted: (userId: string) => {
    trackEvent('profile_setup_started', {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  },

  profileSetupCompleted: (userId: string, profileData?: Record<string, any>) => {
    trackEvent('profile_complete', {
      user_id: userId,
      timestamp: new Date().toISOString(),
      has_photos: profileData?.photos?.length > 0,
      photo_count: profileData?.photos?.length || 0,
    });
  },

  profileUpdated: (userId: string, section?: string) => {
    trackEvent('profile_updated', {
      user_id: userId,
      section,
      timestamp: new Date().toISOString(),
    });
  },

  // Survey Events
  surveyStarted: (userId: string) => {
    trackEvent('survey_started', {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  },

  surveyCompleted: (userId: string, surveyData?: Record<string, any>) => {
    trackEvent('survey_complete', {
      user_id: userId,
      timestamp: new Date().toISOString(),
      ...surveyData,
    });
  },

  // Event Booking Events
  eventViewed: (userId: string, eventId: string, eventName: string) => {
    trackEvent('view_item', {
      user_id: userId,
      item_id: eventId,
      item_name: eventName,
      item_category: 'event',
      timestamp: new Date().toISOString(),
    });
  },

  eventRSVPStarted: (userId: string, eventId: string, eventName: string, price?: number) => {
    trackEvent('begin_checkout', {
      user_id: userId,
      item_id: eventId,
      item_name: eventName,
      value: price || 0,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });
  },

  eventRSVPCompleted: (
    userId: string,
    eventId: string,
    eventName: string,
    price: number,
    transactionId?: string
  ) => {
    trackEvent('purchase', {
      user_id: userId,
      transaction_id: transactionId || `rsvp_${eventId}_${Date.now()}`,
      value: price,
      currency: 'USD',
      items: [
        {
          item_id: eventId,
          item_name: eventName,
          item_category: 'event',
          price: price,
          quantity: 1,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  },

  eventRSVPCancelled: (userId: string, eventId: string, eventName: string) => {
    trackEvent('event_rsvp_cancelled', {
      user_id: userId,
      event_id: eventId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
    });
  },

  // Navigation Events
  navigationClicked: (userId: string, destination: string) => {
    trackEvent('navigation_click', {
      user_id: userId,
      destination,
      timestamp: new Date().toISOString(),
    });
  },

  // Button Click Events
  buttonClicked: (userId: string, buttonName: string, location?: string) => {
    trackEvent('button_click', {
      user_id: userId,
      button_name: buttonName,
      location,
      timestamp: new Date().toISOString(),
    });
  },

  // CTA Events
  ctaClicked: (ctaName: string, location: string, userId?: string) => {
    trackEvent('cta_click', {
      user_id: userId,
      cta_name: ctaName,
      location,
      timestamp: new Date().toISOString(),
    });
  },

  // Subscription Events
  subscriptionStarted: (userId: string, plan: string) => {
    trackEvent('subscription_started', {
      user_id: userId,
      plan,
      timestamp: new Date().toISOString(),
    });
  },

  subscriptionCompleted: (userId: string, plan: string, price: number) => {
    trackEvent('subscribe', {
      user_id: userId,
      plan,
      value: price,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });
  },

  subscriptionCancelled: (userId: string, plan: string) => {
    trackEvent('subscription_cancelled', {
      user_id: userId,
      plan,
      timestamp: new Date().toISOString(),
    });
  },

  // Email Events
  emailOpened: (userId: string, emailType: string, campaignName?: string) => {
    trackEvent('email_opened', {
      user_id: userId,
      email_type: emailType,
      campaign_name: campaignName,
      timestamp: new Date().toISOString(),
    });
  },

  emailLinkClicked: (userId: string, emailType: string, linkUrl: string) => {
    trackEvent('email_link_clicked', {
      user_id: userId,
      email_type: emailType,
      link_url: linkUrl,
      timestamp: new Date().toISOString(),
    });
  },

  // Matching Events
  profilesViewed: (userId: string, count: number) => {
    trackEvent('profiles_viewed', {
      user_id: userId,
      profile_count: count,
      timestamp: new Date().toISOString(),
    });
  },

  matchViewed: (userId: string, matchId: string, matchScore?: number) => {
    trackEvent('match_viewed', {
      user_id: userId,
      match_id: matchId,
      match_score: matchScore,
      timestamp: new Date().toISOString(),
    });
  },

  // Error Tracking
  error: (errorName: string, errorMessage?: string, userId?: string) => {
    trackEvent('error', {
      user_id: userId,
      error_name: errorName,
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  },

  // Admin Events
  adminActionPerformed: (userId: string, action: string, target?: string) => {
    trackEvent('admin_action', {
      user_id: userId,
      action,
      target,
      timestamp: new Date().toISOString(),
    });
  },

  notificationSent: (userId: string, notificationType: string, recipientCount: number) => {
    trackEvent('notification_sent', {
      user_id: userId,
      notification_type: notificationType,
      recipient_count: recipientCount,
      timestamp: new Date().toISOString(),
    });
  },

  // Search Events
  search: (userId: string, searchTerm: string, resultCount?: number) => {
    trackEvent('search', {
      user_id: userId,
      search_term: searchTerm,
      result_count: resultCount,
      timestamp: new Date().toISOString(),
    });
  },

  // Social Sharing
  socialShare: (userId: string, platform: string, contentType: string) => {
    trackEvent('share', {
      user_id: userId,
      method: platform,
      content_type: contentType,
      timestamp: new Date().toISOString(),
    });
  },

  // User Engagement
  timeSpent: (userId: string, page: string, duration: number) => {
    trackEvent('engagement_time', {
      user_id: userId,
      page,
      duration_seconds: duration,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Set user properties
 */
export const setUserProperties = (userId: string, properties: Record<string, any>) => {
  if (!window.gtag) return;

  window.gtag('set', 'user_properties', {
    user_id: userId,
    ...properties,
  });

  console.log('📊 User properties set:', userId, properties);
};

export default analytics;
