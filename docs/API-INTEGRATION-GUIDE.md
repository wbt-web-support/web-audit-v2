# 🔐 Secure API Integration Guide

## Overview
This guide explains how to securely integrate with a Spider API that requires authentication, without exposing API keys to the client-side code.

## Problem
- API requires `X-API-Key` header for authentication
- Client-side code exposes API keys in browser network logs
- Security risk: anyone can inspect and steal your API key

## Solution: Server-Side Proxy Pattern
Create a Next.js API route that acts as a secure proxy between your client and the external API.

---

## Step 1: Environment Variables Setup

### Create `.env.local` file in your project root:
```
API_BASE_URL=http://localhost:3001
API_KEY=your_actual_api_key_here
```

### Important Notes:
- Use `.env.local` (not `.env`) for local development
- Never commit this file to version control
- Add `.env.local` to your `.gitignore`
- These variables are server-only and never exposed to the browser

---

## Step 2: Create API Proxy Route

### File Location: `app/api/scrape/route.ts`

### What this does:
- Receives requests from your client-side code
- Adds the API key header server-side
- Forwards the request to the external API
- Returns the response back to the client
- Keeps the API key completely hidden from the browser

### Key Features:
- Server-side only (runs on Next.js server, not in browser)
- Reads API key from environment variables
- Handles errors gracefully
- Forwards all request data to external API
- Returns proper HTTP status codes

---

## Step 3: Update Client Code

### What to change in your client component:
1. **Remove any client-side API key usage**
2. **Change the fetch URL** from external API to your internal proxy
3. **Remove API key headers** from client-side requests
4. **Add `scrapeType` parameter** to the request body

### Before (Insecure):
```javascript
// ❌ DON'T DO THIS - exposes API key
const response = await fetch('http://localhost:3001/scrape', {
  headers: {
    'X-API-Key': 'your_key' // Visible in browser!
  }
});
```

### After (Secure):
```javascript
// ✅ DO THIS - no API key in client
const response = await fetch('/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    scrapeType: 'full' // or 'imagesOnly'
    // ... other parameters
  })
});
```

---

## Step 4: Request Body Structure

### For `/scrape` endpoint, include:
- `url`: Target website URL (required)
- `scrapeType`: Either `'full'` or `'imagesOnly'`
- `mode`: Either `'single'` or `'multipage'`
- `maxPages`: Maximum pages (for multipage mode)
- `extractImagesFlag`: Boolean (for full scraping)
- `extractLinksFlag`: Boolean (for full scraping)
- `detectTechnologiesFlag`: Boolean (for full scraping)

---

## Step 5: Error Handling

### The proxy handles these scenarios:
- **401 Unauthorized**: API key is invalid or missing
- **Network errors**: External API is unreachable
- **Invalid responses**: Non-JSON responses from external API
- **Server errors**: Any other unexpected errors

### Client should handle:
- Display error messages to users
- Show loading states during requests
- Retry logic if needed

---

## Step 6: Production Deployment

### Environment Variables in Production:
- Set `API_BASE_URL` to your production API URL
- Set `API_KEY` to your production API key
- Use your hosting platform's environment variable settings
- Never hardcode keys in production code

### Security Checklist:
- ✅ API key only exists on server
- ✅ Client never sees the API key
- ✅ Environment variables are properly secured
- ✅ `.env.local` is in `.gitignore`
- ✅ Production uses secure environment variable management

---

## Step 7: Testing

### Local Testing:
1. Start your Next.js development server
2. Make requests to `/api/scrape` from your client
3. Check browser network tab - no API key should be visible
4. Verify requests reach the external API successfully

### Debugging:
- Check server logs for any proxy errors
- Verify environment variables are loaded correctly
- Test with invalid API key to ensure proper error handling

---

## Benefits of This Approach

### Security:
- API key never leaves your server
- No risk of key exposure in browser
- Can rotate keys without client updates

### Flexibility:
- Easy to add rate limiting
- Can add request logging/monitoring
- Can modify requests before forwarding
- Can cache responses if needed

### Maintenance:
- Single place to manage API integration
- Easy to update API endpoints
- Centralized error handling

---

## Alternative Approaches

### If you need different endpoints:
- Create separate proxy routes for each endpoint
- Use dynamic routing: `app/api/scrape/[endpoint]/route.ts`
- Add endpoint parameter to request body

### If you need different authentication:
- Modify the header in the proxy route
- Support multiple authentication methods
- Add token refresh logic

---

## Summary

This pattern ensures your API keys stay secure while maintaining full functionality. The client code becomes simpler and more secure, while the server handles all the sensitive authentication details.

**Key Takeaway**: Never put API keys in client-side code. Always use server-side proxies for external API calls that require authentication.
