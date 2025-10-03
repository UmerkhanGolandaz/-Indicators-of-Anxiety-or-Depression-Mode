# Mental Health Assessment Tool - GitHub Pages Version

This is the **static version** of the Mental Health Assessment Tool designed to run on GitHub Pages.

## How It Works

This version uses **client-side JavaScript** to perform predictions entirely in your browser:

- ✅ **No Backend Required** - All processing happens in the browser
- ✅ **Privacy-First** - No data sent to any server
- ✅ **Based on CDC Data** - Prediction algorithm trained on CDC NHIS patterns
- ✅ **Instant Results** - No API calls, immediate predictions

## Differences from Flask Version

| Feature | Flask Version | GitHub Pages Version |
|---------|--------------|---------------------|
| Backend | Python/Flask | None (client-side only) |
| ML Model | XGBoost (joblib) | JavaScript algorithm |
| Predictions | Server-side | Browser-side |
| Hosting | Requires Python server | Static hosting (GitHub Pages) |
| Accuracy | Uses trained model | Based on CDC data patterns |

## Deployment

This folder (`docs/`) is configured to be served by GitHub Pages.

### Setup GitHub Pages:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select: **main** branch and **/docs** folder
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Files

- `index.html` - Main page (static version of Flask template)
- `style.css` - Styles (copied from Flask version)
- `script.js` - Client-side prediction logic (replaces Python backend)
- `README.md` - This file

## How Predictions Work

The JavaScript prediction algorithm:

1. Starts with CDC base prevalence rates
2. Applies demographic multipliers (age, sex, race, education)
3. Applies major factor adjustments (disability, gender identity, sexual orientation)
4. Applies minor factor adjustments (marital status, employment, state)
5. Returns percentage with risk classification

All multipliers are based on actual CDC NHIS data patterns.

## Accuracy

While this version doesn't use the actual trained XGBoost model, it produces realistic predictions based on:
- CDC population health statistics
- Known demographic correlations
- Research-backed risk factors

For research-grade predictions, use the Flask version with the trained model.

---

**Live Demo**: Once deployed, this will be accessible at your GitHub Pages URL!

