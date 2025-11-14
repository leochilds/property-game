# Deployment to GitHub Pages

This guide explains how to deploy the Property Management Game to GitHub Pages.

## Prerequisites

- Repository must be public (or you need GitHub Pro/Team for private repos)
- You must have admin access to the repository

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/leochilds/property-game
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
   - The workflow file is already configured at `.github/workflows/deploy.yml`

### 2. Push Your Changes

```bash
git add .
git commit -m "Prepare for GitHub Pages deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to the **Actions** tab in your repository
2. You should see the "Build and Deploy to GitHub Pages" workflow running
3. Wait for it to complete (usually takes 2-3 minutes)
4. Once complete, your site will be available at: **https://leochilds.github.io/property-game/**

## What Was Changed

### 1. Base Path Configuration (`svelte.config.js`)
- Added `/property-game` as the base path for production builds
- This ensures all assets load correctly from the GitHub Pages subdirectory

### 2. Version Display
- Added footer showing **Alpha v0.0.1**
- Includes warning about bugs and breaking changes
- Located at the bottom of the main game page

### 3. Help Modal
- Created `HelpModal.svelte` component
- Fixed "?" button in bottom-right corner
- Provides links to:
  - Report bugs
  - Make suggestions
  - View all issues
- All links direct to: https://github.com/leochilds/property-game/issues

### 4. GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- Automatically builds and deploys on push to `main` branch
- Can also be triggered manually from Actions tab
- Builds with `NODE_ENV=production` to apply the base path

## Local Development

For local development, the base path is empty, so you can continue to run:

```bash
npm run dev
```

The app will work normally at `http://localhost:5173`

## Troubleshooting

### Site shows 404
- Make sure GitHub Pages is enabled and set to "GitHub Actions" as the source
- Check that the workflow completed successfully in the Actions tab

### Assets not loading
- The base path configuration should handle this automatically
- Verify that `NODE_ENV=production` is set in the workflow

### Need to redeploy
- Simply push any commit to the `main` branch
- Or manually trigger the workflow from the Actions tab

## Future Updates

When you're ready to release a new version:
1. Update the version in `package.json`
2. Update the version display in `src/routes/+page.svelte` (search for "Alpha v0.0.1")
3. Commit and push to trigger automatic deployment
