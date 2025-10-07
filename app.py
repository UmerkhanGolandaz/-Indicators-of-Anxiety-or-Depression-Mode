from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os
from dotenv import load_dotenv
from ibm_watson import AssistantV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
import json
import requests
import jwt
from functools import wraps
from database import db_manager

# Load environment variables (optional)
try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")
    print("Continuing without environment variables...")

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

# IBM Cloud App ID Configuration
APPID_TENANT_ID = os.getenv('APPID_TENANT_ID')
APPID_CLIENT_ID = os.getenv('APPID_CLIENT_ID')
APPID_CLIENT_SECRET = os.getenv('APPID_CLIENT_SECRET')
APPID_DISCOVERY_ENDPOINT = os.getenv('APPID_DISCOVERY_ENDPOINT')
APPID_REDIRECT_URI = os.getenv('APPID_REDIRECT_URI', 'http://localhost:5000/auth/callback')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', 'your_google_client_id_here')

# Load the model
model = joblib.load('anxiety_depression_model.joblib')

# Initialize Watson Assistant
def init_watson_assistant():
    try:
        # Try to get from environment variables first
        api_key = os.getenv('ASSISTANT_IAM_APIKEY')
        url = os.getenv('ASSISTANT_URL')
        
        # If not found, use hardcoded values as fallback
        if not api_key:
            api_key = 'oGVubRECEeFhuFc5F4CvIk58koNLwW5jcwBX5NtKka46'
        if not url:
            url = 'https://api.us-south.assistant.watson.cloud.ibm.com/instances/a082ae29-2af3-4c79-bdc6-3f4027c5493b'
            
        print(f"Initializing Watson Assistant with URL: {url}")
        print(f"API Key found: {'Yes' if api_key else 'No'}")
        
        authenticator = IAMAuthenticator(api_key)
        assistant = AssistantV2(
            version='2021-11-27',
            authenticator=authenticator
        )
        assistant.set_service_url(url)
        
        # Test the connection
        print("Testing Watson Assistant connection...")
        return assistant
    except Exception as e:
        print(f"Error initializing Watson Assistant: {e}")
        return None

# Global assistant instance
assistant = init_watson_assistant()

# Get the feature names from the model
FEATURE_NAMES = model.feature_names_in_ 

# Authentication helper functions
def get_appid_config():
    """Get App ID configuration from discovery endpoint"""
    try:
        if not APPID_DISCOVERY_ENDPOINT:
            return None
        response = requests.get(APPID_DISCOVERY_ENDPOINT)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error getting App ID config: {e}")
        return None

def login_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_user_info():
    """Get user information from session"""
    return session.get('user', {})

def is_authenticated():
    """Check if user is authenticated"""
    return 'user' in session and 'access_token' in session

def save_user_to_database(user_data, request_info=None):
    """Save user data to Cloudant database"""
    try:
        # Add request information if available
        if request_info:
            user_data['ip_address'] = request_info.remote_addr
            user_data['user_agent'] = request_info.headers.get('User-Agent', '')
        
        # Save user to database
        saved_user = db_manager.save_user(user_data)
        if saved_user:
            print(f"User saved to database: {user_data.get('email', 'Unknown')}")
            return True
        else:
            print("Failed to save user to database")
            return False
    except Exception as e:
        print(f"Error saving user to database: {e}")
        return False

def update_user_login(user_id, login_data, request_info=None):
    """Update user's login information"""
    try:
        if request_info:
            login_data['ip_address'] = request_info.remote_addr
            login_data['user_agent'] = request_info.headers.get('User-Agent', '')
        
        updated_user = db_manager.update_user_login(user_id, login_data)
        if updated_user:
            print(f"User login updated: {user_id}")
            return True
        return False
    except Exception as e:
        print(f"Error updating user login: {e}")
        return False 

@app.route('/')
@login_required
def home():
    return render_template('index.html', user=get_user_info(), is_authenticated=is_authenticated())

@app.route('/login')
def login():
    """Show login page or initiate login with specified provider"""
    if is_authenticated():
        return redirect(url_for('home'))
    
    provider = request.args.get('provider', '')
    
    # Handle different authentication providers
    if provider == 'email':
        return redirect(url_for('email_login'))
    elif provider == 'google':
        return redirect(url_for('google_account_picker'))
    elif provider in ['github', 'ibm']:
        return initiate_oauth_login(provider)
    else:
        # Show main login page with all options
        return render_template('login.html')

def initiate_oauth_login(provider):
    """Initiate OAuth login for the specified provider"""
    config = get_appid_config()
    if not config:
        # Instead of showing error, redirect to email selection
        return redirect(url_for('email_selection', provider=provider))
    
    # Generate state parameter for CSRF protection
    import secrets
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    session['auth_provider'] = provider
    
    # Build authorization URL with provider-specific parameters
    auth_url = f"{config['authorization_endpoint']}?response_type=code&client_id={APPID_CLIENT_ID}&redirect_uri={APPID_REDIRECT_URI}&scope=openid&state={state}"
    
    # Add provider-specific parameters
    if provider == 'google':
        auth_url += "&provider=google"
    elif provider == 'github':
        auth_url += "&provider=github"
    elif provider == 'ibm':
        auth_url += "&provider=ibm"
    
    return redirect(auth_url)

@app.route('/auth/callback')
def auth_callback():
    """Handle OAuth callback from IBM Cloud App ID"""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    
    if error:
        flash(f'Authentication failed: {error}', 'error')
        return redirect(url_for('home'))
    
    if not code or not state:
        flash('Invalid authentication response', 'error')
        return redirect(url_for('home'))
    
    # Verify state parameter
    if state != session.get('oauth_state'):
        flash('Invalid state parameter', 'error')
        return redirect(url_for('home'))
    
    config = get_appid_config()
    if not config:
        flash('Authentication service is not available', 'error')
        return redirect(url_for('home'))
    
    try:
        # Exchange authorization code for tokens
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': APPID_REDIRECT_URI,
            'client_id': APPID_CLIENT_ID,
            'client_secret': APPID_CLIENT_SECRET
        }
        
        response = requests.post(config['token_endpoint'], data=token_data)
        response.raise_for_status()
        tokens = response.json()
        
        # Store tokens in session
        session['access_token'] = tokens['access_token']
        session['id_token'] = tokens.get('id_token')
        session['refresh_token'] = tokens.get('refresh_token')
        
        # Decode and store user information
        if tokens.get('id_token'):
            try:
                # Decode without verification for now (in production, verify the signature)
                user_info = jwt.decode(tokens['id_token'], options={"verify_signature": False})
                provider = session.get('auth_provider', 'ibm')
                
                session['user'] = {
                    'sub': user_info.get('sub'),
                    'email': user_info.get('email'),
                    'name': user_info.get('name', user_info.get('given_name', 'User')),
                    'preferred_username': user_info.get('preferred_username'),
                    'email_verified': user_info.get('email_verified', False),
                    'provider': provider
                }
            except Exception as e:
                print(f"Error decoding ID token: {e}")
                provider = session.get('auth_provider', 'ibm')
                session['user'] = {
                    'name': 'User', 
                    'email': 'user@example.com',
                    'provider': provider
                }
        
        # Clear OAuth state
        session.pop('oauth_state', None)
        
        # Redirect to loading page first, then to home
        return redirect(url_for('loading'))
        
    except Exception as e:
        print(f"Error during token exchange: {e}")
        provider = session.get('auth_provider', 'google')
        return redirect(url_for('email_selection', provider=provider))

@app.route('/logout')
def logout():
    """Logout user and clear session"""
    session.clear()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('home'))

@app.route('/loading')
def loading():
    """Loading page for authentication process"""
    return render_template('loading.html')

@app.route('/auth/error')
def auth_error():
    """Authentication error page"""
    return render_template('auth_error.html')

@app.route('/email/selection')
def email_selection():
    """Email selection page when OAuth fails"""
    provider = request.args.get('provider', 'google')
    return render_template('email_selection.html', provider=provider)

@app.route('/google/account-picker')
def google_account_picker():
    """Google account picker page"""
    if is_authenticated():
        return redirect(url_for('home'))
    
    return render_template('google_simple_login.html', google_client_id=GOOGLE_CLIENT_ID)

@app.route('/google/auth/callback', methods=['GET', 'POST'])
def google_auth_callback():
    """Handle Google authentication callback"""
    try:
        if request.method == 'GET':
            # Handle OAuth redirect callback
            code = request.args.get('code')
            if not code:
                return redirect(url_for('email_selection', provider='google'))
            
            # Exchange code for token
            token_data = {
                'client_id': GOOGLE_CLIENT_ID,
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', ''),
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': request.url
            }
            
            response = requests.post('https://oauth2.googleapis.com/token', data=token_data)
            if response.status_code != 200:
                return redirect(url_for('email_selection', provider='google'))
            
            token_info = response.json()
            access_token = token_info.get('access_token')
            
            # Get user info from Google
            user_response = requests.get(
                f'https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}'
            )
            
            if user_response.status_code != 200:
                return redirect(url_for('email_selection', provider='google'))
            
            user_info = user_response.json()
            
        else:
            # Handle JWT token callback
            data = request.json
            credential = data.get('credential')
            code = data.get('code')
            
            if credential:
                # Decode JWT token
                import base64
                import json
                
                parts = credential.split('.')
                if len(parts) != 3:
                    return jsonify({'success': False, 'error': 'Invalid credential format'}), 400
                
                payload = parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded_payload = base64.urlsafe_b64decode(payload)
                user_info = json.loads(decoded_payload)
                
            elif code:
                # Handle authorization code
                token_data = {
                    'client_id': GOOGLE_CLIENT_ID,
                    'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', ''),
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': data.get('redirect_uri', '')
                }
                
                response = requests.post('https://oauth2.googleapis.com/token', data=token_data)
                if response.status_code != 200:
                    return jsonify({'success': False, 'error': 'Token exchange failed'}), 400
                
                token_info = response.json()
                access_token = token_info.get('access_token')
                
                user_response = requests.get(
                    f'https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}'
                )
                
                if user_response.status_code != 200:
                    return jsonify({'success': False, 'error': 'User info fetch failed'}), 400
                
                user_info = user_response.json()
            else:
                return jsonify({'success': False, 'error': 'No credential or code provided'}), 400
        
        # Prepare user data
        user_data = {
            'sub': user_info.get('id', user_info.get('sub')),
            'email': user_info.get('email'),
            'name': user_info.get('name', user_info.get('given_name', 'Google User')),
            'preferred_username': user_info.get('email', '').split('@')[0],
            'email_verified': user_info.get('verified_email', True),
            'provider': 'google',
            'picture': user_info.get('picture')
        }
        
        # Store user information in session
        session['user'] = user_data
        session['access_token'] = 'google_token_' + str(user_info.get('id', user_info.get('sub', '')))
        
        # Try to save user to Cloudant database (optional)
        save_user_to_database(user_data, request)
        
        if request.method == 'GET':
            return redirect(url_for('loading'))
        else:
            return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error processing Google authentication: {e}")
        if request.method == 'GET':
            return redirect(url_for('email_selection', provider='google'))
        else:
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/email/login', methods=['GET', 'POST'])
def email_login():
    """Email/password login page"""
    if is_authenticated():
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'true'
        
        # Check if user exists in database
        if email and password:
            # Try to get user from database (optional)
            existing_user = None
            try:
                existing_user = db_manager.get_user_by_email(email)
            except:
                pass  # Database not available, continue without it
            
            if existing_user:
                # User exists in database, update login info
                user_data = {
                    'sub': existing_user['_id'],
                    'email': existing_user['email'],
                    'name': existing_user['name'],
                    'preferred_username': existing_user['username'],
                    'email_verified': existing_user['email_verified'],
                    'provider': existing_user['provider']
                }
                
                # Update login information (optional)
                update_user_login(existing_user['_id'], {'provider': 'email'}, request)
                
            else:
                # Create new user (database may not be available)
                user_data = {
                    'sub': f"email_{email}",
                    'email': email,
                    'name': email.split('@')[0].title(),
                    'preferred_username': email.split('@')[0],
                    'email_verified': True,
                    'provider': 'email'
                }
                
                # Try to save new user to database (optional)
                save_user_to_database(user_data, request)
            
            # Store in session regardless of database status
            session['user'] = user_data
            session['access_token'] = 'email_token_' + user_data['sub']
            
            if remember:
                session.permanent = True
            
            flash('Successfully logged in!', 'success')
            return redirect(url_for('loading'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('email_login.html')

@app.route('/email/signup', methods=['GET', 'POST'])
def email_signup():
    """Email/password signup page"""
    if is_authenticated():
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        terms = request.form.get('terms')
        
        # Basic validation
        if not all([first_name, last_name, email, password, confirm_password, terms]):
            flash('Please fill in all required fields', 'error')
        elif password != confirm_password:
            flash('Passwords do not match', 'error')
        elif len(password) < 8:
            flash('Password must be at least 8 characters long', 'error')
        else:
            # Create new user
            user_data = {
                'sub': f"email_{email}",
                'email': email,
                'name': f"{first_name} {last_name}",
                'preferred_username': email.split('@')[0],
                'email_verified': False,
                'provider': 'email'
            }
            
            # Try to save user to database (optional)
            database_saved = save_user_to_database(user_data, request)
            
            # Store user in session regardless of database status
            session['user'] = user_data
            session['access_token'] = 'email_token_' + user_data['sub']
            
            if database_saved:
                flash('Account created successfully!', 'success')
            else:
                flash('Account created successfully! (Database offline)', 'info')
            
            return redirect(url_for('loading'))
    
    return render_template('email_signup.html')

@app.route('/profile')
@login_required
def profile():
    """User profile page"""
    user = get_user_info()
    current_date = datetime.now()
    return render_template('profile.html', user=user, current_date=current_date)

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    """Admin dashboard with user statistics"""
    user = get_user_info()
    
    # Check if user is admin (you can implement proper admin check)
    if not user.get('email') or not user.get('email').endswith('@admin.com'):
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('home'))
    
    # Get user statistics
    stats = db_manager.get_user_stats()
    recent_users = db_manager.get_all_users(limit=10)
    current_date = datetime.now()
    
    return render_template('admin_dashboard.html', 
                         user=user, 
                         stats=stats, 
                         recent_users=recent_users,
                         current_date=current_date)

def create_feature_vector(indicator, age_group, sex, race_ethnicity, education, state):
    """
    Create a one-hot encoded feature vector matching the model's expected input.
    All features start at 0, and we set the relevant ones to 1.
    """
    # Initialize all features to 0
    features = {name: 0 for name in FEATURE_NAMES} 
    
    # Set default time-related features (using reasonable defaults)
    features['Year'] = 2023
    features['Month'] = 6
    features['Start_Day_of_Week'] = 3
    features['Time_Period_Duration'] = 14
    
    # Set indicator feature
    indicator_feature = f'Indicator_{indicator}'
    if indicator_feature in features:
        features[indicator_feature] = 1
    
    # Determine the Group based on the input
    # Age group → By Age
    if age_group:
        features['Group_By Age'] = 1
        subgroup_feature = f'Subgroup_{age_group}'
        if subgroup_feature in features:
            features[subgroup_feature] = 1
    
    # State → By State
    if state and state != 'United States':
        features['Group_By State'] = 1
        state_feature = f'State_{state}'
        if state_feature in features:
            features[state_feature] = 1
    
    # Sex → By Sex
    if sex:
        features['Group_By Sex'] = 1
        subgroup_feature = f'Subgroup_{sex}'
        if subgroup_feature in features:
            features[subgroup_feature] = 1
    
    # Race/Ethnicity → By Race/Hispanic ethnicity
    if race_ethnicity:
        features['Group_By Race/Hispanic ethnicity'] = 1
        subgroup_feature = f'Subgroup_{race_ethnicity}'
        if subgroup_feature in features:
            features[subgroup_feature] = 1
    
    # Education → By Education
    if education:
        features['Group_By Education'] = 1
        subgroup_feature = f'Subgroup_{education}'
        if subgroup_feature in features:
            features[subgroup_feature] = 1
    
    return features

@app.route('/predict', methods=['POST'])
@login_required
def predict():
    try:
        data = request.json
        
        # Get user inputs
        indicator = data.get('indicator')
        age_group = data.get('age_group')
        sex = data.get('sex')
        race_ethnicity = data.get('race_ethnicity')
        education = data.get('education')
        disability = data.get('disability', '')  # Optional but very important
        gender_identity = data.get('gender_identity', '')  # Optional but very important
        sexual_orientation = data.get('sexual_orientation', '')  # Optional but very important
        marital_status = data.get('marital_status', '')  # Optional
        employment = data.get('employment', '')  # Optional
        state = data.get('state')
        
        # Create the feature vector
        features = create_feature_vector(indicator, age_group, sex, race_ethnicity, education, state)
        
        # Create DataFrame with features in the correct order
        df = pd.DataFrame([features], columns=FEATURE_NAMES)
        
        # Make prediction
        prediction = model.predict(df)[0]
        
        # Get confidence interval if model supports it
        try:
            prediction_proba = model.predict_proba(df)[0]
            confidence = float(max(prediction_proba)) * 100
        except:
            confidence = None
        
        # Determine condition name based on indicator
        if "Depressive Disorder" in indicator and "Anxiety" not in indicator:
            condition_name = "depression"
            condition_display = "depressive disorder"
        elif "Anxiety Disorder" in indicator and "Depressive" not in indicator:
            condition_name = "anxiety"
            condition_display = "anxiety disorder"
        else:
            condition_name = "anxiety or depression"
            condition_display = "anxiety or depressive disorder"
        
        # Determine risk level based on population prevalence
        if prediction < 15:
            risk_level = "Low"
            risk_class = "low"
            recommendation = f"Your demographic group shows relatively lower prevalence of {condition_name} symptoms compared to the general population. However, continue monitoring your mental health and practice good self-care."
        elif prediction < 25:
            risk_level = "Moderate"
            risk_class = "moderate"
            recommendation = f"Your demographic group shows moderate prevalence of {condition_name} symptoms. If you're experiencing any concerning symptoms, we encourage you to speak with a healthcare professional for personalized guidance."
        else:
            risk_level = "High"
            risk_class = "high"
            recommendation = f"Your demographic group shows higher prevalence of {condition_name} symptoms. This means a significant portion of people with similar demographics experience these conditions. If you have any symptoms or concerns, we strongly recommend consulting with a mental health professional."
        
        return jsonify({
            'success': True,
            'prediction': float(prediction),
            'risk_level': risk_level,
            'risk_class': risk_class,
            'confidence': confidence,
            'recommendation': recommendation,
            'condition_name': condition_name,
            'condition_display': condition_display,
            'user_inputs': {
                'indicator': indicator,
                'age_group': age_group,
                'sex': sex,
                'race_ethnicity': race_ethnicity,
                'education': education,
                'disability': disability,
                'gender_identity': gender_identity,
                'sexual_orientation': sexual_orientation,
                'marital_status': marital_status,
                'employment': employment,
                'state': state
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    try:
        data = request.json
        message = data.get('message', '').lower().strip()
        session_id = data.get('session_id', '')
        
        # Create session if needed
        if not session_id:
            session_id = f"session_{hash(message) % 10000}"
        
        # Mock mental health assistant responses
        responses = {
            'hello': "Hello! I'm your AI mental health assistant. I can help answer questions about mental health, explain assessment results, or provide general support. How can I help you today?",
            'hi': "Hi there! I'm here to support you with mental health questions. What would you like to know?",
            'help': "I can help you with:\n• Understanding your assessment results\n• General mental health information\n• Coping strategies\n• When to seek professional help\n• Mental health resources\n\nWhat specific area would you like to explore?",
            'anxiety': "Anxiety is a normal emotion, but when it becomes persistent and overwhelming, it may indicate an anxiety disorder. Common symptoms include:\n\n• Excessive worry\n• Restlessness\n• Fatigue\n• Difficulty concentrating\n• Irritability\n• Sleep problems\n• Physical symptoms (racing heart, sweating)\n\nIf you're experiencing these symptoms frequently, consider speaking with a mental health professional.",
            'depression': "Depression is a mood disorder that affects how you feel, think, and handle daily activities. Common symptoms include:\n\n• Persistent sadness or hopelessness\n• Loss of interest in activities\n• Changes in appetite or weight\n• Sleep disturbances\n• Fatigue or low energy\n• Difficulty concentrating\n• Feelings of worthlessness\n\nIf you're experiencing several of these symptoms for two weeks or more, please consider reaching out to a mental health professional.",
            'stress': "Stress is a natural response to challenges, but chronic stress can impact mental health. Here are some coping strategies:\n\n• Practice deep breathing exercises\n• Engage in regular physical activity\n• Maintain a healthy sleep schedule\n• Practice mindfulness or meditation\n• Connect with supportive people\n• Set realistic goals and priorities\n• Take breaks and practice self-care\n\nRemember, it's okay to seek professional help if stress becomes overwhelming.",
            'crisis': "If you're in immediate crisis or having thoughts of self-harm, please reach out for help right away:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911\n• National Helpline: 1-800-662-4357\n\nYou're not alone, and help is available 24/7.",
            'thank': "You're welcome! I'm here whenever you need support or have questions about mental health. Remember, seeking help is a sign of strength, not weakness.",
            'bye': "Take care! Remember that mental health is important, and it's okay to reach out for support when you need it. Have a great day!",
            'goodbye': "Goodbye! Take care of yourself and remember that seeking help for mental health is always a positive step."
        }
        
        # Check for keywords and provide appropriate response
        bot_message = None
        for keyword, response in responses.items():
            if keyword in message:
                bot_message = response
                break
        
        # Default response if no keyword matches
        if not bot_message:
            bot_message = "I'm here to help with mental health questions. I can assist with information about anxiety, depression, stress, coping strategies, or help you understand your assessment results. What would you like to know more about?"
        
        return jsonify({
            'success': True,
            'message': bot_message,
            'session_id': session_id
        })
        
    except Exception as e:
        print(f"Chatbot error: {e}")
        return jsonify({
            'success': True,
            'message': "I'm here to help with mental health questions. How can I assist you today?",
            'session_id': session_id if 'session_id' in locals() else 'error_session'
        })

@app.route('/chatbot/session', methods=['POST'])
def create_chatbot_session():
    try:
        # Create a mock session ID
        import time
        session_id = f"session_{int(time.time())}"
        
        return jsonify({
            'success': True,
            'session_id': session_id
        })
        
    except Exception as e:
        print(f"Session creation error: {e}")
        return jsonify({
            'success': True,
            'session_id': f"fallback_session_{hash(str(time.time())) % 10000}"
        })

@app.route('/about')
def about():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000, load_dotenv=False)

