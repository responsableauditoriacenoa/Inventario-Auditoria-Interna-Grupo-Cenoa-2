<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d86261e4-bdac-4b02-8130-1c06f61669cd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

1. Create a new repository in GitHub and push this project:
   - `git init`
   - `git add .`
   - `git commit -m "Initial commit"`
   - `git branch -M main`
   - `git remote add origin https://github.com/<your-user>/<your-repo>.git`
   - `git push -u origin main`

2. Publish the app:
   - `npm install`
   - `npm run deploy`

3. In GitHub, go to **Settings > Pages** and set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `gh-pages` / `root`

4. Your app will be available at:
   - `https://<your-user>.github.io/<your-repo>/`
