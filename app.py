from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

app = Flask(__name__)

# Load the model
model = joblib.load('anxiety_depression_model.joblib')

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

@app.route('/about')
def about():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)

