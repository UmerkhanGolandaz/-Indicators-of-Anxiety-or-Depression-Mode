# Google Account Picker Setup Guide

This guide will help you set up Google account picker functionality that shows available Google accounts on the user's device when they click "Continue with Google".

## 🔍 What This Feature Does

When users click "Continue with Google", instead of redirecting to a generic OAuth page, they will see:
- A beautiful interface showing available Google accounts on their device
- Account selection with profile pictures and names
- One-click login with their chosen account
- Fallback to email authentication if needed

## 📋 Prerequisites

1. Google Cloud Console account
2. Python 3.8+ installed
3. Your Flask application running
4. HTTPS enabled (required for Google OAuth in production)

## 🚀 Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Note your project ID

### 1.2 Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and enable the API

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - **App name**: Mental Health Assessment Tool
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. Add test users (for development)

### 1.4 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Set authorized JavaScript origins:
   - Development: `http://localhost:5000`
   - Production: `https://yourdomain.com`
5. Set authorized redirect URIs:
   - Development: `http://localhost:5000/google/auth/callback`
   - Production: `https://yourdomain.com/google/auth/callback`
6. Copy the **Client ID** (you'll need this)

## 🔧 Step 2: Environment Configuration

Update your `.env` file with Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here

# Other existing configurations...
APPID_TENANT_ID=your_tenant_id_here
APPID_CLIENT_ID=your_client_id_here
# ... etc
```

## 🎨 Step 3: Features Implemented

### Google Account Picker Interface
- **Beautiful UI** with Google branding
- **Account Selection** showing available Google accounts
- **Profile Pictures** and names displayed
- **One-Click Login** with selected account
- **Fallback Options** to other authentication methods

### Backend Integration
- **JWT Token Decoding** to extract user information
- **Session Management** for Google users
- **Profile Picture Support** in user profiles
- **Error Handling** with graceful fallbacks

### User Experience Flow
1. **User clicks "Continue with Google"**
2. **Account picker loads** showing available accounts
3. **User selects account** from their device
4. **One-click authentication** with selected account
5. **Redirect to assessment** tool

## 🛡️ Step 4: Security Features

### Implemented Security
- **JWT Token Validation** - Verifies Google's signed tokens
- **CSRF Protection** - State parameter validation
- **Input Sanitization** - All user data is validated
- **Session Security** - Secure session management
- **Error Handling** - Graceful fallback on failures

### Google OAuth Security
- **HTTPS Required** - Google OAuth requires HTTPS in production
- **Token Verification** - JWT tokens are verified server-side
- **Scope Limitation** - Only requests necessary user information
- **Secure Redirects** - Authorized redirect URIs only

## 🧪 Step 5: Testing

### Test the Google Account Picker
1. **Start your Flask application**
   ```bash
   python app.py
   ```

2. **Visit the login page**
   - Go to `http://localhost:5000`
   - Click "Continue with Google"

3. **Test account selection**
   - You should see available Google accounts
   - Select an account to sign in
   - Verify you're redirected to the assessment tool

### Test Error Scenarios
- **No Google accounts** - Should show fallback options
- **Invalid credentials** - Should redirect to email selection
- **Network errors** - Should handle gracefully

## 🚀 Step 6: Production Deployment

### HTTPS Configuration
Google OAuth requires HTTPS in production:
1. **Set up SSL certificate** for your domain
2. **Update authorized origins** in Google Cloud Console
3. **Update redirect URIs** to use HTTPS
4. **Test OAuth flow** in production

### Environment Variables
Set production environment variables:
```bash
export GOOGLE_CLIENT_ID="your_production_client_id"
export SECRET_KEY="your_production_secret_key"
# ... other variables
```

## 📱 Step 7: Mobile Support

### Responsive Design
- **Mobile-optimized** interface
- **Touch-friendly** account selection
- **Adaptive layout** for different screen sizes

### Mobile Browser Support
- **Chrome Mobile** - Full support
- **Safari Mobile** - Full support
- **Firefox Mobile** - Full support
- **Edge Mobile** - Full support

## 🔧 Step 8: Troubleshooting

### Common Issues

1. **"Invalid client ID"**
   - Check `GOOGLE_CLIENT_ID` in environment variables
   - Verify client ID in Google Cloud Console
   - Ensure client ID matches the project

2. **"Redirect URI mismatch"**
   - Check authorized redirect URIs in Google Cloud Console
   - Ensure URLs match exactly (including trailing slashes)
   - Verify HTTPS vs HTTP configuration

3. **"Accounts not showing"**
   - Check if user is signed in to Google in browser
   - Verify Google+ API is enabled
   - Check browser console for JavaScript errors

4. **"Token verification failed"**
   - Check JWT token format
   - Verify token is not expired
   - Check server logs for decoding errors

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📊 Step 9: Analytics & Monitoring

### Track Google OAuth Usage
```python
# Log Google authentication events
logging.info(f"Google OAuth: User {user_id} signed in with {email}")
logging.warning(f"Google OAuth: Failed authentication for {email}")
```

### Monitor Success Rates
- Track successful Google logins
- Monitor fallback to email authentication
- Log error rates and types

## 🎯 Step 10: Advanced Features

### Future Enhancements
1. **Account Linking** - Link multiple Google accounts
2. **Profile Sync** - Sync profile pictures and names
3. **Permission Management** - Granular permission control
4. **Multi-Device Support** - Cross-device account selection

### Customization Options
- **Custom Styling** - Match your brand colors
- **Additional Scopes** - Request more user information
- **Custom Redirects** - Redirect to specific pages after login

## 📚 Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [JWT Token Debugger](https://jwt.io)

## 🆘 Support

For issues with:
- **Google OAuth**: Check Google Cloud Console configuration
- **Account Picker**: Verify JavaScript console for errors
- **Backend Integration**: Check server logs and JWT decoding
- **Mobile Support**: Test on different devices and browsers

## ✅ Checklist

- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Environment variables set
- [ ] HTTPS configured (for production)
- [ ] Tested on desktop browsers
- [ ] Tested on mobile devices
- [ ] Error handling verified
- [ ] Production deployment tested

The Google account picker feature is now fully implemented and ready to provide users with a seamless, device-aware authentication experience!
