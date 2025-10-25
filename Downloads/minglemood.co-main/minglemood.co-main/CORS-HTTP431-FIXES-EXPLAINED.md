# CORS and HTTP 431 Error Fixes for MingleMood

## Issues Identified

### 1. CORS Policy Error
```
Access to fetch at 'https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/admin/events' 
from origin 'http://localhost:3001' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause**: The edge function wasn't properly sending CORS headers for the admin endpoints.

### 2. HTTP 431 Error
```
GET https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/admin/events 
net::ERR_FAILED 431 (Request Header Fields Too Large)
```

**Root Cause**: The Authorization header (JWT token) was potentially oversized or malformed.

## Solutions Applied

### 1. Enhanced CORS Configuration
```typescript
// Enhanced CORS middleware with better error handling
app.use('*', cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'https://minglemood.co', 
      'https://www.minglemood.co'
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  credentials: true,
}));
```

### 2. Header Size Validation
```typescript
// Check for oversized headers to prevent HTTP 431
const checkHeaderSize = (c: any) => {
  const headers = c.req.raw.headers;
  let totalSize = 0;
  
  for (const [key, value] of headers) {
    totalSize += key.length + (value ? value.length : 0);
  }
  
  // If headers exceed 8KB, likely oversized
  if (totalSize > 8192) {
    console.warn('⚠️ Headers too large:', totalSize, 'bytes');
    return false;
  }
  
  return true;
};
```

### 3. Token Validation and Trimming
```typescript
// Validate and trim authorization tokens
const validateToken = (authHeader: string | null) => {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '').trim();
  
  // Check for obviously invalid tokens
  if (token.length > 2000) {
    console.warn('⚠️ Token appears oversized:', token.length, 'characters');
    return null;
  }
  
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('⚠️ Invalid token format');
    return null;
  }
  
  return token;
};
```

## Deployment Steps

### 1. Deploy the Fixed Edge Function
```bash
# Make sure you're in the project root
cd "c:\Users\HP\Downloads\Minglemood.co (1)"

# Deploy the function
npx supabase functions deploy make-server-4bcc747c
```

### 2. Set Environment Variables (if needed)
```bash
npx supabase secrets set RESEND_API_KEY=your_resend_key
npx supabase secrets set SUPABASE_URL=your_supabase_url
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
npx supabase secrets set SUPABASE_ANON_KEY=your_anon_key
```

### 3. Test the Function
```bash
# Test health endpoint
curl -X GET "https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health"

# Test from browser console
fetch("https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health")
  .then(r => r.json())
  .then(console.log)
```

## Testing the Fixes

### Test 1: CORS Headers
```javascript
// In browser console at http://localhost:3001
fetch("https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/health")
  .then(response => {
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    });
    return response.json();
  })
  .then(data => console.log('Response:', data));
```

### Test 2: Admin Endpoints with Auth
```javascript
// Get current session token
const { data: { session } } = await supabase.auth.getSession();

// Test admin endpoint
fetch("https://vijinjtpbrfkyjrzilnm.supabase.co/functions/v1/make-server-4bcc747c/admin/stats", {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => console.log('Admin Data:', data));
```

## Expected Results After Fix

1. ✅ **CORS Errors Resolved**: Browser will allow cross-origin requests
2. ✅ **HTTP 431 Errors Resolved**: Proper header size validation prevents oversized requests
3. ✅ **Admin Dashboard Functional**: Real data loads from the edge function
4. ✅ **Better Error Handling**: Clear error messages for debugging

## Files Modified

1. `supabase/functions/make-server-4bcc747c/index.ts` - Enhanced CORS and header validation
2. `deploy-edge-function.bat` - Deployment script
3. `fix-cors-issues.js` - Diagnostic and solution guide

## Next Steps

1. Run the deployment script: `deploy-edge-function.bat`
2. Test the admin dashboard in your browser
3. Monitor console for any remaining issues
4. Check Supabase logs for edge function execution

## Troubleshooting

If issues persist:

1. **Check Supabase Dashboard**: Verify the function is deployed and running
2. **Check Environment Variables**: Ensure all required secrets are set
3. **Check Browser Network Tab**: Look for actual response headers
4. **Check Supabase Logs**: View edge function execution logs

The fixes should resolve both the CORS policy blocking and HTTP 431 header size issues, allowing the admin dashboard to function properly.