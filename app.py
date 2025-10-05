from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os
from dotenv import load_dotenv
from ibm_watson import AssistantV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
import json

# Load environment variables (optional)
try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")
    print("Continuing without environment variables...")

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')

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

@app.route('/')
def home():
    return render_template('index.html')

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

