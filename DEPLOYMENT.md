# Deployment Guide

## Why GitHub Pages Doesn't Work

This is a **Flask application** (Python backend), which requires a server to run. GitHub Pages only hosts **static websites** (HTML, CSS, JavaScript files) and cannot run Python code or Flask servers.

## Recommended Hosting Options

### Option 1: Render (FREE & Easiest)

[Render](https://render.com) offers free hosting for web applications.

**Steps:**
1. Push your code to GitHub (see below)
2. Go to [render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `mental-health-assessment`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Add `gunicorn` to requirements.txt (see below)
7. Click "Create Web Service"

**Cost**: FREE tier available

### Option 2: PythonAnywhere (FREE)

[PythonAnywhere](https://www.pythonanywhere.com) offers free Python web hosting.

**Steps:**
1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Go to "Web" tab → "Add a new web app"
3. Choose "Flask" framework
4. Upload your files
5. Install requirements: `pip install -r requirements.txt`
6. Configure WSGI file to point to your app

**Cost**: FREE tier available

### Option 3: Heroku

[Heroku](https://heroku.com) offers easy deployment for web apps.

**Steps:**
1. Push your code to GitHub
2. Sign up at [heroku.com](https://heroku.com)
3. Install Heroku CLI
4. Create a `Procfile` (see below)
5. Run:
   ```bash
   heroku create
   git push heroku main
   ```

**Cost**: Requires credit card for verification

### Option 4: Railway

[Railway](https://railway.app) offers modern deployment.

**Steps:**
1. Push your code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Flask and deploys

**Cost**: FREE tier available

## Required Files for Deployment

### 1. Add Gunicorn to requirements.txt

Add this line to `requirements.txt`:
```
gunicorn==21.2.0
```

### 2. Create Procfile (for Heroku)

Create a file named `Procfile` (no extension):
```
web: gunicorn app:app
```

### 3. Update app.py (Optional)

For production, modify the last line of `app.py`:
```python
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

## Pushing to GitHub

1. **Initialize Git** (already done):
   ```bash
   git init
   ```

2. **Stage all files**:
   ```bash
   git add .
   ```

3. **Commit**:
   ```bash
   git commit -m "Initial commit: Mental Health Assessment Tool"
   ```

4. **Create GitHub repository**:
   - Go to [github.com](https://github.com)
   - Click "+" → "New repository"
   - Name: `mental-health-assessment`
   - Keep it public or private
   - Don't initialize with README (we already have one)
   - Click "Create repository"

5. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/mental-health-assessment.git
   git branch -M main
   git push -u origin main
   ```

## Limitations to Consider

- **Model File Size**: The `anxiety_depression_model.joblib` file might be large. If it's over 100MB, you'll need to use Git LFS (Large File Storage) or upload it separately.
- **Free Tier Limits**: Most free hosting services have limitations (sleep after inactivity, limited compute resources, etc.)

## Recommended Approach

For the easiest deployment, I recommend:
1. ✅ **Render** - Best free option, easiest setup
2. ✅ **Railway** - Modern, automatic deployment
3. ✅ **PythonAnywhere** - Good for Python apps specifically

All three offer free tiers and are beginner-friendly!

