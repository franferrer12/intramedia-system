# Instagram OAuth Integration - Setup Guide

## Overview

This system supports two methods for Instagram data collection:
1. **OAuth Connection** (Preferred) - Full access via Instagram Graph API with photos and complete metrics
2. **Scraping Fallback** - Basic metrics only with custom placeholders (no photos)

## FASE 2 Complete: Instagram OAuth Integration ✅

### Features Implemented

- ✅ **Encryption Service** - AES-256-CBC encryption for OAuth tokens
- ✅ **Instagram Graph API Service** - Complete API integration
- ✅ **OAuth Flow** - Authorization code → Short-lived → Long-lived tokens
- ✅ **Auto-refresh** - Automatic token renewal (60-day tokens)
- ✅ **Database Integration** - Encrypted token storage
- ✅ **Hybrid System** - OAuth + Scraping fallback

---

## 1. Instagram App Setup (Facebook Developers)

### Step 1: Create a Facebook App

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Choose **"Business"** as app type
4. Fill in app details:
   - **App Name**: Intra Media System
   - **App Contact Email**: your-email@example.com
5. Click **"Create App"**

### Step 2: Add Instagram Basic Display

1. In your app dashboard, click **"Add Product"**
2. Find **"Instagram Basic Display"** and click **"Set Up"**
3. Scroll to **"User Token Generator"** section
4. Click **"Add or Remove Instagram Testers"**
5. Add your Instagram Business/Creator accounts as testers

### Step 3: Get App Credentials

1. Go to **Settings > Basic**
2. Copy your **App ID** and **App Secret**
3. Update your `.env` file:

```env
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3001/api/oauth/instagram/callback
```

### Step 4: Configure OAuth Redirect URIs

1. Go to **Instagram Basic Display > Basic Display**
2. Under **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3001/api/oauth/instagram/callback` (development)
   - `https://your-domain.com/api/oauth/instagram/callback` (production)
3. Under **"Deauthorize Callback URL"**, add:
   - `https://your-domain.com/api/oauth/instagram/deauthorize`
4. Under **"Data Deletion Request URL"**, add:
   - `https://your-domain.com/api/oauth/instagram/data-deletion`
5. Click **"Save Changes"**

### Step 5: Accept Instagram Tester Invitation

1. Log in to the Instagram account you want to connect
2. Go to Instagram Settings > Apps and Websites > Tester Invites
3. Accept the invitation from your app

---

## 2. Environment Variables

### Required Variables

```env
# Encryption (already generated)
ENCRYPTION_KEY=ed40967f3a8820ca17596af987bbfe25b36e7c12e4448aa6942ae5daf5cff4e4

# Instagram OAuth
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3001/api/oauth/instagram/callback

# Instagram Graph API
INSTAGRAM_GRAPH_API_VERSION=v21.0
INSTAGRAM_GRAPH_API_BASE_URL=https://graph.instagram.com

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
```

---

## 3. API Endpoints

### OAuth Flow

#### 1. Initiate OAuth
```
GET /api/oauth/instagram/authorize?djId=1
```
Redirects user to Instagram authorization page.

#### 2. Callback (called by Instagram)
```
GET /api/oauth/instagram/callback?code=...&state=1
```
Handles OAuth callback, exchanges code for token.

#### 3. Get Connection Status
```
GET /api/oauth/instagram/status/:djId
```
Response:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "connection_type": "oauth",
    "username": "dj_username",
    "last_sync": "2025-10-20T15:30:00Z",
    "last_sync_status": "success",
    "token_expires_at": "2025-12-20T15:30:00Z",
    "token_expired": false
  }
}
```

#### 4. Get Analytics (OAuth)
```
GET /api/oauth/instagram/analytics/:djId
```
Response:
```json
{
  "success": true,
  "data": {
    "connection_type": "oauth",
    "profile": {
      "username": "dj_username",
      "account_type": "BUSINESS",
      "media_count": 150
    },
    "metrics": {
      "followers": 25000,
      "impressions": 50000,
      "reach": 35000,
      "profile_views": 5000,
      "posts_count": 25,
      "total_engagement": 12500,
      "engagement_rate": 5.2
    },
    "recent_posts": [
      {
        "id": "123456789",
        "caption": "Amazing event tonight!",
        "media_type": "IMAGE",
        "media_url": "https://...",
        "thumbnail_url": "https://...",
        "permalink": "https://instagram.com/p/...",
        "timestamp": "2025-10-15T20:00:00Z",
        "likes": 500,
        "comments": 50,
        "engagement": 550
      }
    ],
    "top_post": {
      "id": "123456789",
      "engagement": 1200
    },
    "last_updated": "2025-10-20T15:30:00Z"
  }
}
```

#### 5. Refresh Token
```
POST /api/oauth/instagram/refresh/:djId
Authorization: Bearer <jwt_token>
```
Manually refresh Instagram long-lived token.

#### 6. Disconnect
```
DELETE /api/oauth/instagram/disconnect/:djId
Authorization: Bearer <jwt_token>
```
Disconnect Instagram OAuth, switch back to scraping.

---

## 4. Database Schema

### oauth_tokens Table
```sql
CREATE TABLE oauth_tokens (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id),
  platform VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,  -- Encrypted with AES-256
  refresh_token TEXT,           -- Encrypted
  token_type VARCHAR(50),
  expires_at TIMESTAMP,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_refreshed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id, platform)
);
```

### social_connections Table
```sql
CREATE TABLE social_connections (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id),
  platform VARCHAR(50) NOT NULL,
  connection_type VARCHAR(20) NOT NULL,  -- 'oauth' or 'scraping'
  is_active BOOLEAN DEFAULT true,
  username VARCHAR(255),
  last_sync TIMESTAMP,
  last_sync_status VARCHAR(20),
  sync_error_message TEXT,
  UNIQUE(dj_id, platform)
);
```

---

## 5. OAuth Flow Diagram

```
┌─────────────┐
│   DJ Dashboard   │
│  "Connect IG"    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ GET /api/oauth/instagram/authorize?djId=1│
│ Redirect to Instagram                    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Instagram Authorization Screen       │
│ User logs in and approves            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ GET /api/oauth/instagram/callback        │
│ ├─ Exchange code for short-lived token   │
│ ├─ Exchange for long-lived token (60d)   │
│ ├─ Get user profile from Graph API       │
│ ├─ Encrypt and save token to DB          │
│ └─ Update social_connections table       │
└────────┬──────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Redirect to Frontend Success Page   │
│ /djs/:djId/instagram-connect         │
│ ?success=true&username=dj_username   │
└──────────────────────────────────────┘
```

---

## 6. Token Lifecycle

### Short-Lived Token (1 hour)
- ✅ Obtained from authorization code
- ✅ Immediately exchanged for long-lived token
- ❌ Not stored

### Long-Lived Token (60 days)
- ✅ Obtained from short-lived token
- ✅ Encrypted with AES-256-CBC
- ✅ Stored in `oauth_tokens` table
- ✅ Can be refreshed before expiration

### Token Refresh
- Manual: `POST /api/oauth/instagram/refresh/:djId`
- Automatic: Coming in FASE 3 (scheduled job)

---

## 7. Security Features

### Encryption
- **Algorithm**: AES-256-CBC
- **Key Length**: 32 bytes (256 bits)
- **IV**: Random 16 bytes per encryption
- **Storage**: `access_token:encrypted` = `IV:encrypted_data`

### Access Control
- OAuth initiate: Public (requires valid djId)
- OAuth callback: Public (called by Instagram)
- Get status: Public
- Get analytics: Optional auth (better permissions)
- Refresh token: **Private** (JWT required)
- Disconnect: **Private** (JWT required)

---

## 8. Testing the Integration

### Without Instagram App (Demo Mode)

The system will fall back to scraping mode:

```bash
curl http://localhost:3001/api/oauth/instagram/status/1
```

Response will show `connection_type: "scraping"`

### With Instagram App Configured

1. **Start OAuth flow**:
   ```
   Navigate to: http://localhost:3001/api/oauth/instagram/authorize?djId=1
   ```

2. **Complete Instagram authorization**

3. **Check connection status**:
   ```bash
   curl http://localhost:3001/api/oauth/instagram/status/1
   ```

4. **Get OAuth analytics**:
   ```bash
   curl http://localhost:3001/api/oauth/instagram/analytics/1
   ```

---

## 9. Troubleshooting

### Error: "Instagram OAuth is not configured"
**Solution**: Set `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` in `.env`

### Error: "No active Instagram connection found"
**Solution**: DJ needs to connect their Instagram account first

### Error: "Instagram token expired"
**Solution**: DJ needs to reconnect or use token refresh endpoint

### Error: "Failed to fetch Instagram profile"
**Possible Causes**:
- Invalid Instagram App credentials
- Instagram account not added as tester
- Network/API issues

**Solution**:
1. Verify app credentials in Facebook Developers
2. Check that Instagram account accepted tester invitation
3. Check server logs for detailed error

### Error: "Invalid encrypted text format"
**Solution**: Token was corrupted or `ENCRYPTION_KEY` changed. DJ needs to reconnect.

---

## 10. Next Steps (FASE 3-6)

### FASE 3: Backoffice Admin Panel
- DJ management interface
- Social media connections manager
- Sync logs and error tracking

### FASE 4: Portal DJ
- Personal dashboard
- Instagram connect button
- Monthly reports view

### FASE 5: Monthly Report Generation
- Automated cron job (1st of each month)
- PDF generation with PDFKit
- Excel generation with ExcelJS
- Email notifications

### FASE 6: Advanced Features
- Notification system
- Benchmarking and comparisons
- Audience insights (OAuth only)

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Ensure Instagram App is properly configured
- Test with a simple DJ account first

## Instagram App Requirements

### Account Types Supported
- ✅ Instagram Business accounts
- ✅ Instagram Creator accounts
- ❌ Personal accounts (limited features)

### Required Permissions
- `instagram_basic` - Basic profile access
- `instagram_content_publish` - (Future: Post scheduling)
- `pages_show_list` - Access to connected Facebook Pages
- `pages_read_engagement` - Engagement metrics

---

**FASE 2 Status**: ✅ COMPLETE

All OAuth integration features have been implemented and are ready for testing once Instagram App credentials are configured.
