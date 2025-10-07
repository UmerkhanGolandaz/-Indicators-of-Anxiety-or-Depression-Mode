# Cloudant Database Integration Setup Guide

This guide will help you set up Cloudant database integration to store all user login information, track user activity, and manage user accounts.

## 🗄️ What This Integration Provides

- **User Data Storage** - All user accounts stored in Cloudant
- **Login History Tracking** - Track when and how users log in
- **User Analytics** - Admin dashboard with user statistics
- **Multi-Provider Support** - Google, GitHub, Email, IBM Cloud
- **Data Persistence** - User data survives server restarts
- **Admin Management** - View and manage all users

## 📋 Prerequisites

1. IBM Cloud account with Cloudant service
2. Cloudant service instance created
3. Service credentials obtained
4. Python 3.8+ installed
5. Your Flask application running

## 🚀 Step 1: Cloudant Service Setup

### 1.1 Create Cloudant Service
1. Go to [IBM Cloud Console](https://cloud.ibm.com)
2. Navigate to **Catalog** → **Databases** → **Cloudant**
3. Click **Create** to create a new Cloudant service
4. Choose **Lite** plan (free tier) for development
5. Select your region and resource group
6. Click **Create**

### 1.2 Get Service Credentials
1. Go to your Cloudant service instance
2. Click **Service credentials** in the left sidebar
3. Click **New credential**
4. Name it "Service-credentials-1"
5. Click **Add** to create the credential
6. Copy the credentials JSON (you already have this!)

## 🔧 Step 2: Environment Configuration

Update your `.env` file with the Cloudant credentials:

```env
# Cloudant Database Configuration
CLOUDANT_APIKEY=qQB6RAo20iBX1TMBuMozE5B3rwhVZbzN6_S255KN8ux-
CLOUDANT_HOST=a4b042cf-c63f-4df9-acaf-df5ada3d4c7a-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=a4b042cf-c63f-4df9-acaf-df5ada3d4c7a-bluemix
CLOUDANT_URL=https://a4b042cf-c63f-4df9-acaf-df5ada3d4c7a-bluemix.cloudantnosqldb.appdomain.cloud
```

## 📦 Step 3: Install Dependencies

Install the Cloudant Python library:

```bash
pip install cloudant==2.15.0
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

## 🗃️ Step 4: Database Structure

The integration automatically creates a database called `mental_health_users` with the following structure:

### User Document Schema
```json
{
  "_id": "user_email_or_id",
  "type": "user",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "provider": "google|github|email|ibm",
  "email_verified": true,
  "picture": "https://profile-picture-url.com",
  "created_at": "2025-01-27T10:30:00.000Z",
  "last_login": "2025-01-27T15:45:00.000Z",
  "login_count": 5,
  "login_history": [
    {
      "timestamp": "2025-01-27T15:45:00.000Z",
      "provider": "google",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

## 🎯 Step 5: Features Implemented

### User Data Storage
- **Automatic User Creation** - New users are saved to Cloudant
- **User Updates** - Existing users are updated with new login info
- **Profile Pictures** - Google profile pictures are stored
- **Email Verification** - Track verification status

### Login History Tracking
- **Login Timestamps** - When users last logged in
- **Provider Tracking** - Which method they used to log in
- **IP Address Logging** - Track user locations
- **User Agent Tracking** - Device and browser information
- **Login Count** - Total number of logins

### Admin Dashboard
- **User Statistics** - Total users, verified emails, recent logins
- **Provider Distribution** - Chart showing auth method usage
- **Recent Users Table** - List of latest user registrations
- **Database Status** - Connection and health information

### Multi-Provider Support
- **Google OAuth** - Full integration with profile pictures
- **GitHub OAuth** - User data from GitHub
- **Email/Password** - Traditional authentication
- **IBM Cloud App ID** - Enterprise authentication

## 🛡️ Step 6: Security Features

### Data Protection
- **Secure Credentials** - API keys stored in environment variables
- **Data Encryption** - Cloudant provides encryption at rest
- **Access Control** - IAM-based authentication
- **Audit Logging** - All operations are logged

### Privacy Compliance
- **User Consent** - Users agree to data storage
- **Data Minimization** - Only necessary data is stored
- **Retention Policy** - Login history limited to 50 records
- **User Rights** - Users can view their data in profile

## 🧪 Step 7: Testing the Integration

### Test User Registration
1. **Start your Flask application**
   ```bash
   python app.py
   ```

2. **Register a new user**
   - Go to `http://localhost:5000`
   - Click "Continue with Google" or "Sign in with Email"
   - Complete the authentication process

3. **Check Cloudant database**
   - Go to IBM Cloud Console
   - Open your Cloudant service
   - Click "Launch Cloudant Dashboard"
   - View the `mental_health_users` database
   - Verify your user document was created

### Test Admin Dashboard
1. **Access admin dashboard**
   - Create a user with email ending in `@admin.com`
   - Go to `http://localhost:5000/admin/dashboard`
   - View user statistics and recent users

## 📊 Step 8: Monitoring and Analytics

### User Analytics Available
- **Total User Count** - How many users have registered
- **Provider Distribution** - Which auth methods are most popular
- **Verification Rates** - How many users have verified emails
- **Recent Activity** - Users who logged in recently
- **Login Patterns** - Frequency and timing of logins

### Database Monitoring
- **Connection Status** - Real-time connection health
- **Query Performance** - Database response times
- **Storage Usage** - How much data is stored
- **Error Tracking** - Failed operations and errors

## 🔧 Step 9: Troubleshooting

### Common Issues

1. **"Database not connected"**
   - Check Cloudant credentials in `.env` file
   - Verify Cloudant service is running
   - Check network connectivity

2. **"User not found"**
   - Check if user exists in database
   - Verify email address format
   - Check database indexes

3. **"Failed to save user"**
   - Check Cloudant permissions
   - Verify API key is valid
   - Check database quota limits

4. **"Admin access denied"**
   - Ensure user email ends with `@admin.com`
   - Check user authentication status
   - Verify admin route permissions

### Debug Mode
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🚀 Step 10: Production Deployment

### Environment Variables
Set production environment variables:
```bash
export CLOUDANT_APIKEY="your_production_api_key"
export CLOUDANT_HOST="your_production_host"
export CLOUDANT_USERNAME="your_production_username"
export CLOUDANT_URL="your_production_url"
```

### Database Indexes
The system automatically creates necessary indexes:
- **Email Index** - For searching users by email
- **Provider Index** - For filtering by authentication provider
- **Created Date Index** - For sorting by registration date

### Backup Strategy
- **Cloudant Backups** - Automatic backups provided by IBM
- **Data Export** - Regular exports of user data
- **Disaster Recovery** - Multi-region replication available

## 📈 Step 11: Advanced Features

### Future Enhancements
1. **User Preferences** - Store user settings and preferences
2. **Assessment History** - Track mental health assessment results
3. **Notification Settings** - Email and push notification preferences
4. **Data Export** - Allow users to download their data
5. **Account Deletion** - GDPR-compliant account deletion

### Custom Queries
You can add custom database queries:
```python
# Get users by provider
users = db_manager.get_users_by_provider('google')

# Get users registered in last 30 days
recent_users = db_manager.get_recent_users(days=30)

# Get user login statistics
stats = db_manager.get_user_login_stats()
```

## 📚 Additional Resources

- [Cloudant Documentation](https://cloud.ibm.com/docs/Cloudant)
- [Cloudant Python SDK](https://python-cloudant.readthedocs.io/)
- [IBM Cloud Console](https://cloud.ibm.com)
- [Cloudant Dashboard](https://cloudant.com/dashboard)

## 🆘 Support

For issues with:
- **Cloudant Connection**: Check credentials and service status
- **User Data**: Verify database permissions and indexes
- **Admin Dashboard**: Check user permissions and data format
- **Performance**: Monitor database usage and query performance

## ✅ Checklist

- [ ] Cloudant service created in IBM Cloud
- [ ] Service credentials obtained and configured
- [ ] Environment variables set in `.env` file
- [ ] Cloudant Python library installed
- [ ] Database connection tested
- [ ] User registration tested
- [ ] Admin dashboard accessible
- [ ] User data visible in Cloudant dashboard
- [ ] Login history tracking working
- [ ] All authentication providers tested

The Cloudant database integration is now fully implemented and ready to store all user login information with comprehensive tracking and management capabilities!
