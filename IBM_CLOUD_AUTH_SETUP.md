# IBM Cloud Authentication Setup Guide

This guide will help you set up IBM Cloud App ID authentication for your Mental Health Assessment Tool.

## Prerequisites

1. IBM Cloud account
2. Python 3.8+ installed
3. Your Flask application running

## Step 1: Create IBM Cloud App ID Service

1. **Log in to IBM Cloud Console**
   - Go to [https://cloud.ibm.com](https://cloud.ibm.com)
   - Sign in with your IBM Cloud account

2. **Create App ID Service**
   - Navigate to the Catalog
   - Search for "App ID"
   - Click on "App ID" service
   - Choose a pricing plan (Lite plan is free)
   - Select a region (e.g., us-south)
   - Give your service a name (e.g., "mental-health-auth")
   - Click "Create"

3. **Configure App ID**
   - Once created, click on your App ID service
   - Go to "Applications" tab
   - Click "Add application"
   - Choose "Single page application" or "Regular web application"
   - Fill in the details:
     - **Name**: Mental Health Assessment Tool
     - **Redirect URIs**: 
       - For development: `http://localhost:5000/auth/callback`
       - For production: `https://yourdomain.com/auth/callback`
   - Click "Save"

4. **Get Credentials**
   - In the "Applications" tab, click on your application
   - Copy the following values:
     - **Client ID**
     - **Client Secret** (if using regular web application)
     - **Discovery Endpoint** (found in the "Service credentials" section)

## Step 2: Configure Environment Variables

1. **Create .env file**
   ```bash
   cp env_template.txt .env
   ```

2. **Update .env with your credentials**
   ```env
   # IBM Cloud App ID Configuration
   APPID_TENANT_ID=your_tenant_id_here
   APPID_CLIENT_ID=your_client_id_here
   APPID_CLIENT_SECRET=your_client_secret_here
   APPID_DISCOVERY_ENDPOINT=https://us-south.appid.cloud.ibm.com/oauth/v4/your_tenant_id/.well-known/openid_configuration
   APPID_REDIRECT_URI=http://localhost:5000/auth/callback

   # Flask Configuration
   SECRET_KEY=your-secret-key-here
   FLASK_ENV=development

   # IBM Watson Assistant (existing)
   ASSISTANT_IAM_APIKEY=your_watson_api_key_here
   ASSISTANT_URL=your_watson_url_here
   ```

3. **Generate a secure secret key**
   ```python
   import secrets
   print(secrets.token_hex(32))
   ```

## Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 4: Configure App ID Settings

1. **Set up Identity Providers**
   - In your App ID service, go to "Identity providers"
   - Enable "Cloud Directory" or configure your preferred identity provider
   - For testing, you can use Cloud Directory

2. **Configure User Management**
   - Go to "Users" tab
   - Add test users or configure user registration
   - Set up email verification if needed

3. **Configure Scopes and Claims**
   - Go to "Scopes" tab
   - Ensure "openid" scope is available
   - Configure custom claims if needed

## Step 5: Test the Authentication

1. **Start your Flask application**
   ```bash
   python app.py
   ```

2. **Test the flow**
   - Visit `http://localhost:5000`
   - Click "Login" button
   - You should be redirected to IBM Cloud App ID login page
   - After successful login, you'll be redirected back to your app
   - You should see your user profile information

## Step 6: Production Deployment

1. **Update Redirect URIs**
   - In your App ID application settings
   - Add your production domain to redirect URIs
   - Update `APPID_REDIRECT_URI` in your production environment

2. **Environment Variables**
   - Set all environment variables in your production environment
   - Use a secure secret key
   - Consider using IBM Cloud Key Protect for sensitive credentials

3. **Security Considerations**
   - Enable HTTPS in production
   - Use secure session configuration
   - Consider implementing token refresh logic
   - Set up proper logging and monitoring

## Features Added

### Authentication Routes
- `/login` - Initiates OAuth flow
- `/auth/callback` - Handles OAuth callback
- `/logout` - Logs out user
- `/profile` - User profile page (protected)

### Protected Routes
- `/predict` - Mental health assessment (now requires authentication)

### UI Components
- Login/Logout buttons in header
- User profile display
- Flash messages for authentication status
- Authentication notice for unauthenticated users

### Security Features
- CSRF protection with state parameter
- Session management
- JWT token handling
- Secure redirect handling

## Troubleshooting

### Common Issues

1. **"Authentication service is not available"**
   - Check your `APPID_DISCOVERY_ENDPOINT` URL
   - Ensure your App ID service is active
   - Verify network connectivity

2. **"Invalid state parameter"**
   - This is normal security behavior
   - Try logging in again
   - Clear browser cookies if persistent

3. **Redirect URI mismatch**
   - Check that your redirect URI in App ID matches exactly
   - Include both HTTP and HTTPS versions if needed
   - Ensure no trailing slashes

4. **Token decode errors**
   - Check that your JWT library is up to date
   - Verify the token format
   - Check App ID configuration

### Debug Mode

Enable debug logging by adding to your app.py:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Security Best Practices

1. **Never commit .env files**
2. **Use environment variables in production**
3. **Implement proper session timeout**
4. **Use HTTPS in production**
5. **Regularly rotate secrets**
6. **Monitor authentication logs**
7. **Implement rate limiting**

## Support

For IBM Cloud App ID specific issues:
- [IBM Cloud App ID Documentation](https://cloud.ibm.com/docs/appid)
- [IBM Cloud Support](https://cloud.ibm.com/unifiedsupport/supportcenter)

For application-specific issues:
- Check the application logs
- Verify environment variables
- Test with a simple OAuth flow first
