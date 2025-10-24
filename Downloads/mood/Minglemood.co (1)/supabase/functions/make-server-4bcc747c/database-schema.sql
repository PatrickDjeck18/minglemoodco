-- MingleMood Database Schema
-- This file contains the SQL schema for the MingleMood application

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    profile_complete BOOLEAN DEFAULT FALSE,
    survey_completed BOOLEAN DEFAULT FALSE,
    subscription_plan TEXT DEFAULT 'basic',
    is_active BOOLEAN DEFAULT TRUE,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    maxAttendees INTEGER DEFAULT 50,
    currentAttendees INTEGER DEFAULT 0,
    category TEXT DEFAULT 'Social',
    image TEXT,
    organizer TEXT DEFAULT 'MingleMood Social',
    featured BOOLEAN DEFAULT FALSE,
    requiresRsvp BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'Open',
    cancellationPolicy TEXT,
    dressCode TEXT,
    ageRestriction TEXT,
    includesFood BOOLEAN DEFAULT FALSE,
    includesDrinks BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rsvps table
CREATE TABLE IF NOT EXISTS rsvps (
    id TEXT PRIMARY KEY,
    eventId UUID REFERENCES events(id) ON DELETE CASCADE,
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    attendeeName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    dietaryRestrictions TEXT,
    emergencyContact TEXT,
    emergencyPhone TEXT,
    specialRequests TEXT,
    status TEXT DEFAULT 'pending',
    paymentStatus TEXT DEFAULT 'pending',
    amount DECIMAL(10,2) DEFAULT 0,
    ticketNumber TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    matchedUserId UUID REFERENCES users(id) ON DELETE CASCADE,
    compatibility INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    otherUserId UUID REFERENCES users(id) ON DELETE CASCADE,
    lastMessage TEXT,
    lastMessageTime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unreadCount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'basic',
    status TEXT DEFAULT 'active',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT,
    template_type TEXT,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    targetAudience TEXT DEFAULT 'all',
    sentBy UUID REFERENCES users(id) ON DELETE CASCADE,
    sentAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    eventId UUID REFERENCES events(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    paymentIntentId TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(userId);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(eventId);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(userId);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(userId);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(userId);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Events are public for reading
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

-- RSVPs are private to the user
CREATE POLICY "Users can view own RSVPs" ON rsvps
    FOR SELECT USING (auth.uid() = userId);

CREATE POLICY "Users can create own RSVPs" ON rsvps
    FOR INSERT WITH CHECK (auth.uid() = userId);

-- Matches are private to the user
CREATE POLICY "Users can view own matches" ON matches
    FOR SELECT USING (auth.uid() = userId OR auth.uid() = matchedUserId);

-- Conversations are private to participants
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = userId OR auth.uid() = otherUserId);

-- Subscriptions are private to the user
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = userId);

-- Email logs are private to the user
CREATE POLICY "Users can view own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = userId);

-- Payments are private to the user
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = userId);

-- Admin policies (for admin users)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN ('hello@minglemood.co', 'mutemela72@gmail.com')
    );

CREATE POLICY "Admins can view all events" ON events
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('hello@minglemood.co', 'mutemela72@gmail.com')
    );

CREATE POLICY "Admins can view all RSVPs" ON rsvps
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN ('hello@minglemood.co', 'mutemela72@gmail.com')
    );

CREATE POLICY "Admins can view all email logs" ON email_logs
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN ('hello@minglemood.co', 'mutemela72@gmail.com')
    );

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample events
INSERT INTO events (title, description, date, time, location, price, maxAttendees, category, image, featured, requiresRsvp, cancellationPolicy, dressCode, ageRestriction, includesFood, includesDrinks) VALUES
('Wine Tasting & Networking Evening', 'Join us for an elegant evening of wine tasting featuring boutique California wineries. Connect with like-minded professionals in an intimate setting.', '2025-11-15', '19:00', 'The Wine Loft, San Francisco', 85.00, 30, 'Social', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800', true, true, 'Full refund until 48 hours before event', 'Smart Casual', '28+', true, true),
('Sunset Yacht Mixer', 'Experience the bay like never before on our exclusive sunset yacht party. Premium bar, gourmet appetizers, and spectacular views.', '2025-11-22', '18:30', 'Pier 39 Marina, San Francisco', 150.00, 50, 'Premium', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800', true, true, 'Full refund until 7 days before event', 'Cocktail Attire', '30+', true, true),
('Art Gallery Opening & Cocktails', 'Private viewing of contemporary art followed by cocktails and conversation with artists and collectors.', '2025-11-08', '19:30', 'SFMOMA, San Francisco', 65.00, 40, 'Cultural', 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800', false, true, 'Full refund until 24 hours before event', 'Business Casual', '25+', true, true)
ON CONFLICT DO NOTHING;
