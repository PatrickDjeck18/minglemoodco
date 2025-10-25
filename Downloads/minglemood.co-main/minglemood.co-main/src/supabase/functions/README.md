# MingleMood Edge Functions

This directory contains the Supabase Edge Functions for the MingleMood platform.

## Structure

```
supabase/functions/
└── server/
    ├── index.tsx           # Main server entry point (Hono web server)
    ├── kv_store.tsx        # Key-value store utilities (DO NOT EDIT)
    ├── email-service.tsx   # Email functionality via Resend API
    └── database-setup.tsx  # Database initialization and migration utilities
```

## Main Function: make-server-4bcc747c

This is the primary backend server for MingleMood, built with Hono framework.

### Endpoints

#### **Public Endpoints**
- `GET /make-server-4bcc747c/health` - Health check

#### **Authentication Endpoints**
- `POST /make-server-4bcc747c/signup` - User registration
- `POST /make-server-4bcc747c/login` - User login (handled by Supabase)

#### **Admin Endpoints** (Require admin authentication)
- `GET /make-server-4bcc747c/admin/stats` - Platform statistics
- `GET /make-server-4bcc747c/admin/users` - List all users
- `DELETE /make-server-4bcc747c/admin/users/:email` - Delete user by email
- `GET /make-server-4bcc747c/admin/profile-responses` - All user profiles
- `GET /make-server-4bcc747c/admin/events` - Event management
- `GET /make-server-4bcc747c/admin/email-logs` - Email delivery logs
- `POST /make-server-4bcc747c/admin/send-notification` - Send notifications

#### **Event Endpoints**
- `GET /make-server-4bcc747c/events` - List events
- `POST /make-server-4bcc747c/events` - Create event (admin)
- `POST /make-server-4bcc747c/rsvp` - RSVP to event
- `GET /make-server-4bcc747c/rsvp/:userId` - Get user RSVPs

#### **Payment Endpoints** (Stripe integration)
- `POST /make-server-4bcc747c/create-payment-intent` - Create Stripe payment

#### **Email Endpoints**
- `POST /make-server-4bcc747c/send-email` - Send email via Resend

## Environment Variables

The following environment variables are automatically available:

- `SUPABASE_URL` - Your Supabase project URL (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-provided)
- `SUPABASE_ANON_KEY` - Anonymous key (auto-provided)

You need to set these manually:

- `RESEND_API_KEY` - Your Resend API key for emails
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Setting Secrets

```bash
supabase secrets set RESEND_API_KEY=your_key_here
supabase secrets set STRIPE_SECRET_KEY=your_key_here
supabase secrets set STRIPE_PUBLISHABLE_KEY=your_key_here
```

## Deployment

Deploy this function using:

```bash
supabase functions deploy make-server-4bcc747c
```

Or use the deployment scripts in the root directory:
- `./deploy.sh` (Mac/Linux)
- `deploy.bat` (Windows)

## Local Development

To run the function locally:

```bash
supabase functions serve make-server-4bcc747c
```

## Viewing Logs

To see real-time logs:

```bash
supabase functions logs make-server-4bcc747c
```

Or view in the Supabase Dashboard:
1. Edge Functions
2. make-server-4bcc747c
3. Logs tab

## Files Overview

### index.tsx
The main server file built with Hono. Contains all route handlers and business logic.

**Key Features:**
- User authentication & signup
- Admin dashboard APIs
- Event management
- RSVP system
- Email notifications
- Payment processing (Stripe)

### kv_store.tsx
⚠️ **PROTECTED FILE - DO NOT EDIT**

Provides utilities for interacting with the Supabase key-value table:
- `get(key)` - Get single value
- `set(key, value)` - Set single value
- `del(key)` - Delete single value
- `mget(keys)` - Get multiple values
- `mset(entries)` - Set multiple values
- `mdel(keys)` - Delete multiple values
- `getByPrefix(prefix)` - Get all keys with prefix

### email-service.tsx
Email functionality using Resend API.

**Functions:**
- `sendEmail(to, subject, html, from?)` - Send email
- `sendWelcomeEmail(user)` - Welcome email template
- `sendEventInvite(user, event)` - Event invitation
- `sendRSVPConfirmation(rsvp)` - RSVP confirmation

### database-setup.tsx
Database initialization and migration utilities.

**Functions:**
- `setupDatabase()` - Initialize database tables
- `migrateUserData()` - Migrate user data from auth to KV
- `getAdminStats()` - Calculate platform statistics

## Security

### Admin Access
Only users with email `hello@minglemood.co` have admin access.

Admin endpoints verify:
1. Valid access token
2. User email matches admin email

### User Data
- User profiles stored in Supabase Auth user_metadata
- Additional data in KV store
- All user data encrypted at rest

## Testing

After deployment, test the health endpoint:

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-4bcc747c/health
```

Expected response:
```json
{"status":"ok","message":"MingleMood server is running"}
```

## Troubleshooting

### Function not responding
1. Check deployment: `supabase functions list`
2. View logs: `supabase functions logs make-server-4bcc747c`
3. Verify in Supabase Dashboard

### Email not working
1. Verify RESEND_API_KEY is set: `supabase secrets list`
2. Check Resend dashboard for API key validity
3. View email logs in function logs

### Admin endpoints return 401
1. Ensure you're logged in as hello@minglemood.co
2. Check access token is being sent in Authorization header
3. Session may have expired - log out and log back in

## Development Notes

- The function name `make-server-4bcc747c` is intentionally unique to avoid conflicts
- All routes are prefixed with `/make-server-4bcc747c/`
- CORS is configured to allow all origins for development
- The function uses Deno runtime (not Node.js)
- Import packages with `npm:` prefix (e.g., `npm:hono`)

## Support

For issues or questions:
1. Check the logs first
2. Review the DEPLOYMENT-GUIDE.md in root
3. Open verify-deployment.html for diagnostic tests
4. Check Supabase documentation: https://supabase.com/docs/guides/functions
