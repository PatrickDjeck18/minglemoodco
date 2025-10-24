# MingleMood Social - Dating & Events Platform

A comprehensive dating and event platform with profile management, matching algorithms, event booking, and admin dashboard.

## 🎯 Platform Overview

MingleMood Social is an exclusive dating platform that hosts profiles of 400+ individuals with:
- Photo galleries and personal information
- Intelligent matching algorithm
- Event management and RSVP system
- Automated notifications via email
- Subscription management
- Admin dashboard for user and event management

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend API
- **Hosting**: Vercel

## 📁 Project Structure

```
├── App.tsx                      # Main application component
├── components/
│   ├── admin-dashboard.tsx      # Admin control panel
│   ├── auth-component.tsx       # Authentication UI
│   ├── events-component.tsx     # Event listing and booking
│   ├── profile-setup-component.tsx  # Profile creation/editing
│   ├── preferences-survey.tsx   # User preference questionnaire
│   ├── email-funnel-manager.tsx # Email campaign management
│   └── ui/                      # ShadCN UI components
├── utils/
│   └── supabase/
│       ├── client.tsx           # Supabase client configuration
│       └── info.tsx             # Project information
├── supabase/functions/
│   └── make-server-4bcc747c/    # Edge Function (deployed)
│       ├── index.ts             # Main server routes
│       ├── kv_store.ts          # Database utilities
│       ├── email-service.ts     # Email templates
│       └── database-setup.ts    # Data migration
└── styles/globals.css           # Global styles

```

## 🔑 Key Features

### User Features
- ✅ Secure authentication and profile management
- ✅ Photo upload and gallery
- ✅ Personalized preference survey
- ✅ Event discovery and RSVP
- ✅ Privacy-protected profiles
- ✅ Subscription management

### Admin Features
- ✅ User management (approve/reject/edit/delete)
- ✅ Event creation and management
- ✅ Email notification system
- ✅ Email funnel automation
- ✅ Profile deactivation manager
- ✅ Real-time analytics dashboard
- ✅ Payment tracking with Stripe

## 🌐 Live Deployment

- **Website**: https://minglemood.co
- **Supabase Project**: https://vijinjtpbrfkyjrzilnm.supabase.co
- **Edge Function**: https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c
- **Email**: hello@minglemood.co (via Microsoft Outlook)

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (optional, for payments)
- Resend API key (optional, for emails)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (`.env`):
   ```env
   VITE_SUPABASE_URL=https://vijinjtpbrfkyjrzilnm.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

### Edge Function Deployment

Deploy the backend Edge Function:

```bash
# Mac/Linux
chmod +x fix-and-deploy-edge-function.sh
./fix-and-deploy-edge-function.sh

# Windows
fix-and-deploy-edge-function.bat
```

Or manually:

```bash
supabase functions deploy make-server-4bcc747c --project-ref vijinjtpbrfkyjrzilnm
```

## 📧 Email Configuration

Configure email sending in Supabase Dashboard:

1. Go to: Settings → Edge Functions → Secrets
2. Add: `RESEND_API_KEY` with your Resend API key
3. Email templates are in `/supabase/functions/make-server-4bcc747c/email-service.ts`

## 💳 Payment Configuration

Configure Stripe payments:

1. Go to: Settings → Edge Functions → Secrets
2. Add: `STRIPE_SECRET_KEY` with your Stripe secret key
3. Payment handling is in the Edge Function

## 👥 Admin Access

Admin accounts:
- `hello@minglemood.co`
- `mutemela72@gmail.com`

Admin users have access to:
- User management
- Event creation
- Email campaigns
- Analytics dashboard

## 🔒 Privacy & Security

- Member profiles are kept private
- No public profile browsing after completion
- Curated matching only
- Secure authentication with Supabase
- GDPR-compliant data handling

## 📊 Database Schema

Main tables (stored in Supabase):
- `auth.users` - User accounts and metadata
- `kv_store_4bcc747c` - Key-value data storage
- Events, RSVPs, and matches stored in KV store

## 🎨 Design System

Using Tailwind CSS with custom tokens:
- Primary colors: Purple gradient (#BF94EA → #FA7872)
- Typography: System fonts (-apple-system, BlinkMacSystemFont)
- Components: ShadCN UI library

## 📱 Mobile Support

Fully responsive design with:
- Touch-optimized interactions
- Mobile navigation menu
- Responsive layouts
- PWA support (coming soon)

## 🚢 Deployment Scripts

Available deployment scripts:

| Script | Platform | Purpose |
|--------|----------|---------|
| `fix-and-deploy-edge-function.sh` | Mac/Linux | Deploy Edge Function |
| `fix-and-deploy-edge-function.bat` | Windows | Deploy Edge Function |

## 📝 License

© 2024 MingleMood. All rights reserved.

## 📞 Support

For questions or support:
- Email: hello@minglemood.co
- Website: https://minglemood.co

## 🛣️ Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Video profiles
- [ ] In-app messaging
- [ ] Advanced matching algorithms
- [ ] Integration with social media
- [ ] Multi-language support
