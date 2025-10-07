# Multi-Provider Authentication Setup Guide

This guide will help you set up Google, GitHub, Email, and IBM Cloud authentication for your Mental Health Assessment Tool.

## 🔐 Authentication Providers Available

1. **Google OAuth** - Sign in with Google account
2. **GitHub OAuth** - Sign in with GitHub account  
3. **Email/Password** - Traditional email and password authentication
4. **IBM Cloud** - IBM Cloud App ID authentication

## 📋 Prerequisites

1. IBM Cloud account
2. Google Cloud Console account (for Google OAuth)
3. GitHub account (for GitHub OAuth)
4. Python 3.8+ installed
5. Your Flask application running

## 🚀 Step 1: IBM Cloud App ID Setup

### 1.1 Create App ID Service
1. Go to [IBM Cloud Console](https://cloud.ibm.com)
2. Navigate to Catalog → Search "App ID"
3. Create the service (Lite plan is free)
4. Select a region (e.g., us-south)

### 1.2 Configure Identity Providers
1. In your App ID service, go to **Identity providers**
2. Enable the following providers:

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Set authorized redirect URIs:
   - `https://us-south.appid.cloud.ibm.com/oauth/v4/{tenant-id}/callback`
7. Copy Client ID and Client Secret
8. In IBM Cloud App ID, add Google provider with these credentials

#### GitHub OAuth Setup
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - **Application name**: Mental Health Assessment Tool
   - **Homepage URL**: Your app URL
   - **Authorization callback URL**: `https://us-south.appid.cloud.ibm.com/oauth/v4/{tenant-id}/callback`
4. Copy Client ID and Client Secret
5. In IBM Cloud App ID, add GitHub provider with these credentials

#### Email/Password Setup
1. In IBM Cloud App ID, go to **Identity providers**
2. Enable **Cloud Directory**
3. Configure password policies
4. Set up email verification if needed

### 1.3 Configure Application
1. Go to **Applications** tab in App ID
2. Create a new application
3. Set redirect URIs:
   - Development: `http://localhost:5000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
4. Copy Client ID and Client Secret

## 🔧 Step 2: Environment Configuration

Update your `.env` file with all provider credentials:

```env
# IBM Cloud App ID Configuration
APPID_TENANT_ID=your_tenant_id_here
APPID_CLIENT_ID=your_client_id_here
APPID_CLIENT_SECRET=your_client_secret_here
APPID_DISCOVERY_ENDPOINT=https://us-south.appid.cloud.ibm.com/oauth/v4/your_tenant_id/.well-known/openid_configuration
APPID_REDIRECT_URI=http://localhost:5000/auth/callback

# Google OAuth (if using direct integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (if using direct integration)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email Configuration (for email verification)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Database Configuration (for user storage)
DATABASE_URL=sqlite:///users.db

# Flask Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development

# IBM Watson Assistant (existing)
ASSISTANT_IAM_APIKEY=your_watson_api_key_here
ASSISTANT_URL=your_watson_url_here
```

## 📱 Step 3: User Interface Features

### Login Page Features
- **Multiple Provider Buttons**: Google, GitHub, Email, IBM Cloud
- **Responsive Design**: Works on all devices
- **Provider Branding**: Each button has appropriate colors and icons
- **Smooth Animations**: Hover effects and transitions

### Email Authentication Features
- **Sign Up Form**: First name, last name, email, password
- **Password Strength Indicator**: Real-time strength checking
- **Password Confirmation**: Ensures passwords match
- **Terms & Conditions**: Required checkbox
- **Newsletter Opt-in**: Optional subscription

### User Profile Features
- **Provider Badge**: Shows which method was used to sign in
- **Account Information**: User details and verification status
- **Provider Switching**: Can link multiple accounts (future feature)

## 🔄 Step 4: Authentication Flow

### OAuth Providers (Google, GitHub, IBM Cloud)
1. User clicks provider button
2. Redirected to provider's OAuth page
3. User authorizes the application
4. Provider redirects back with authorization code
5. App exchanges code for access token
6. User information is extracted from token
7. User is logged in and redirected to home

### Email Authentication
1. User clicks "Sign in with Email"
2. Redirected to email login/signup page
3. User enters credentials or creates account
4. Credentials are validated
5. User session is created
6. User is logged in and redirected to home

## 🛡️ Step 5: Security Features

### Implemented Security Measures
- **CSRF Protection**: State parameters for OAuth flows
- **Session Management**: Secure session handling
- **Password Validation**: Strong password requirements
- **Input Sanitization**: All user inputs are validated
- **Error Handling**: Secure error messages
- **Provider Verification**: Token validation

### Recommended Additional Security
- **Rate Limiting**: Prevent brute force attacks
- **Account Lockout**: After multiple failed attempts
- **Email Verification**: For email signups
- **Two-Factor Authentication**: For enhanced security
- **Audit Logging**: Track authentication events

## 🧪 Step 5: Testing

### Test Each Provider
1. **Google OAuth**:
   - Click "Continue with Google"
   - Complete Google OAuth flow
   - Verify user data is correct

2. **GitHub OAuth**:
   - Click "Continue with GitHub"
   - Complete GitHub OAuth flow
   - Verify user data is correct

3. **Email Authentication**:
   - Click "Sign in with Email"
   - Test both login and signup flows
   - Verify password validation works

4. **IBM Cloud**:
   - Click "IBM Cloud Account"
   - Complete IBM Cloud OAuth flow
   - Verify user data is correct

### Test Error Scenarios
- Invalid credentials
- Network errors
- Provider service down
- Invalid redirect URIs

## 🚀 Step 6: Production Deployment

### Environment Variables
Set all environment variables in your production environment:
```bash
export APPID_TENANT_ID="your_production_tenant_id"
export APPID_CLIENT_ID="your_production_client_id"
# ... etc
```

### Redirect URIs
Update redirect URIs in all OAuth providers:
- Google Cloud Console
- GitHub OAuth App
- IBM Cloud App ID

### SSL/HTTPS
- Ensure your production site uses HTTPS
- Update all redirect URIs to use HTTPS
- Configure proper SSL certificates

## 📊 Step 7: Monitoring & Analytics

### Track Authentication Metrics
- Login success/failure rates by provider
- Most popular authentication methods
- User registration patterns
- Error rates and types

### Logging
```python
import logging

# Log authentication events
logging.info(f"User {user_id} logged in via {provider}")
logging.warning(f"Failed login attempt for {email} via {provider}")
```

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check redirect URIs in all OAuth providers
   - Ensure they match exactly (including trailing slashes)
   - Verify HTTPS vs HTTP

2. **"Client ID not found"**
   - Verify environment variables are set correctly
   - Check client ID in provider console
   - Ensure application is enabled

3. **"Email verification not working"**
   - Check email configuration
   - Verify SMTP settings
   - Check spam folder

4. **"Session not persisting"**
   - Check SECRET_KEY is set
   - Verify session configuration
   - Check browser cookie settings

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📚 Additional Resources

- [IBM Cloud App ID Documentation](https://cloud.ibm.com/docs/appid)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Flask-Security Documentation](https://flask-security.readthedocs.io/)

## 🎯 Next Steps

1. **Account Linking**: Allow users to link multiple providers
2. **Social Login**: Add more providers (Facebook, Twitter, etc.)
3. **Two-Factor Authentication**: Enhanced security
4. **Password Reset**: Email-based password recovery
5. **User Management**: Admin panel for user management

## 📞 Support

For issues specific to:
- **IBM Cloud App ID**: [IBM Cloud Support](https://cloud.ibm.com/unifiedsupport/supportcenter)
- **Google OAuth**: [Google Cloud Support](https://cloud.google.com/support)
- **GitHub OAuth**: [GitHub Support](https://support.github.com/)
- **Application Issues**: Check application logs and error messages
