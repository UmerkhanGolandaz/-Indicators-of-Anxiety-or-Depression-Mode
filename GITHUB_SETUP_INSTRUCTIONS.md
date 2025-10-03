# GitHub Setup Instructions

## ✅ What's Already Done

1. ✅ Git repository initialized
2. ✅ All files committed
3. ✅ Deployment files created (.gitignore, Procfile, runtime.txt)
4. ✅ Requirements updated with gunicorn and xgboost

## 📝 Next Steps - Push to GitHub

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** button in the top right
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `mental-health-assessment` (or any name you prefer)
   - **Description**: "AI-Powered Mental Health Assessment Tool using Machine Learning"
   - **Visibility**: Choose Public or Private
   - ⚠️ **DO NOT** check "Initialize this repository with a README" (we already have one)
5. Click **"Create repository"**

### Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these in PowerShell:

```powershell
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/mental-health-assessment.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Example:**
```powershell
git remote add origin https://github.com/johndoe/mental-health-assessment.git
git branch -M main
git push -u origin main
```

You'll be prompted to enter your GitHub credentials.

### Step 3: Verify

Go to your GitHub repository URL and verify all files are there!

## 🚀 Deploy Your App

Since this is a Flask app, you **cannot** use GitHub Pages. Instead, use one of these FREE hosting options:

### Option A: Render (Recommended - Easiest)

1. Go to [render.com](https://render.com)
2. Sign up/Login (can use GitHub account)
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `mental-health-assessment`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. You'll get a URL like: `https://mental-health-assessment.onrender.com`

### Option B: Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway auto-detects and deploys!
6. You'll get a URL automatically

### Option C: PythonAnywhere

1. Go to [pythonanywhere.com](https://www.pythonanywhere.com)
2. Sign up for FREE account
3. Go to **"Web"** tab → **"Add a new web app"**
4. Choose **"Flask"** framework
5. Upload your files or clone from GitHub
6. Install requirements: `pip install -r requirements.txt`
7. Configure WSGI file

## 📦 What Each File Does

- **`.gitignore`**: Tells Git which files to ignore (e.g., __pycache__, .env)
- **`Procfile`**: Tells hosting services how to run your app
- **`runtime.txt`**: Specifies Python version
- **`requirements.txt`**: Lists all Python dependencies (updated with gunicorn)
- **`DEPLOYMENT.md`**: Detailed deployment guide

## ⚠️ Important Notes

1. **GitHub Pages doesn't work** for Flask apps - it only hosts static HTML/CSS/JS
2. Your app needs a **server** to run Python code
3. All recommended hosting options have **FREE tiers**
4. Your model file (3.52 MB) is fine for GitHub (under 100 MB limit)

## 🆘 Need Help?

If you encounter any issues:
1. Make sure Git is installed: `git --version`
2. Make sure you're logged into GitHub
3. Check that your repository URL is correct
4. If push fails, you might need a Personal Access Token (see GitHub docs)

## 🎉 After Deployment

Once deployed, you can:
- Share the live URL with anyone
- Access it from any device
- Update by pushing to GitHub (auto-deploys on most platforms)

Good luck! 🚀

