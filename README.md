# AI-Powered Mental Health Assessment Tool

## Project Overview

Early management of anxiety and depression requires accurate diagnosis; however, conventional diagnostic techniques are frequently resource-intensive and subjective. This project leverages machine learning with the **CDC's Indicators of Anxiety or Depression Dataset** to create an unbiased, precise, and scalable predictive model.

### Project Goals

- ✅ **Early Detection**: Enable rapid screening for anxiety and depression symptoms
- ✅ **Data-Driven Approach**: Utilize population-level health data for objective assessment
- ✅ **Reduce Healthcare Burden**: Provide scalable, accessible screening tools
- ✅ **Improve Outcomes**: Support timely intervention through early identification
- ✅ **Minimize Subjectivity**: Offer consistent, algorithm-based risk assessment

## Features

- 🧠 **XGBoost ML Model** trained on CDC population health data
- 🎯 **Risk Stratification** (Low/Moderate/High) with actionable recommendations
- 📊 **Population-Level Analysis** using 146 demographic and temporal features
- 🎨 Beautiful, modern UI with professional gradient design
- 📱 Fully responsive design for mobile and desktop
- 🔒 Privacy-focused (no data stored)
- ♿ Accessible and user-friendly interface

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

## How to Use

1. **Select Assessment Type**: Choose from:
   - Symptoms of Depressive Disorder
   - Symptoms of Anxiety Disorder
   - Symptoms of Anxiety or Depressive Disorder (Combined)

2. **Enter Demographics**: Provide:
   - Age group
   - Sex
   - Race/Ethnicity
   - Education level
   - State of residence

3. **Get Results**: Receive instant:
   - Predicted prevalence percentage
   - Risk level classification (Low/Moderate/High)
   - Personalized recommendations
   - Mental health resources for early intervention

## Clinical Application

This tool serves as a **first-line screening instrument** to:
- Identify individuals who may benefit from further clinical evaluation
- Support healthcare providers in prioritizing cases
- Enable early intervention before symptoms escalate
- Reduce wait times for mental health services by efficient triage
- Provide objective data to complement clinical judgment

## Important Notes

⚠️ **Clinical Disclaimer**: This is an early detection screening tool designed to complement professional clinical evaluation. It uses population-level data patterns and should NOT replace comprehensive psychiatric assessment. Always consult qualified mental health professionals for diagnosis and treatment planning.

If you or someone you know is in crisis:
- **Call or text 988** - National Suicide Prevention Lifeline
- **Text HOME to 741741** - Crisis Text Line
- **Call 1-800-662-4357** - SAMHSA National Helpline

## Technical Details

### Machine Learning Architecture
- **Model Type**: XGBoost Regressor
- **Training Data**: CDC Indicators of Anxiety or Depression Dataset
- **Features**: 146 one-hot encoded features including:
  - Temporal features (Year, Month, Day of Week, Duration)
  - Indicator types (3 categories)
  - Demographic groups (6 categories: Age, Sex, Race/Ethnicity, Education, State, Disability, etc.)
  - Geographic data (50 US states + DC)
  - Subgroup classifications (130+ specific demographic combinations)
- **Output**: Predicted prevalence percentage (0-100%)
- **Encoding**: One-hot encoding for categorical variables

### Technology Stack
- **Backend**: Flask (Python 3.12+)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **ML Framework**: XGBoost with scikit-learn
- **Data Processing**: Pandas, NumPy
- **Model Storage**: Joblib serialization

## File Structure

```
Project_1/
├── app.py                          # Flask application
├── anxiety_depression_model.joblib # ML model
├── requirements.txt                # Python dependencies
├── templates/
│   └── index.html                 # Main page
├── static/
│   ├── style.css                  # Styles
│   └── script.js                  # JavaScript
└── README.md                      # Documentation
```

## Customization

You can customize the appearance by editing:
- `static/style.css` - Colors, fonts, layout
- `static/script.js` - Interactions and animations
- `templates/index.html` - Structure and content

## License

This project is for educational purposes.

