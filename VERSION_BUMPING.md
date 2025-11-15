# Automated Version Bumping

This project uses an automated version bumping system with Calendar Versioning (CalVer) format: `YYYY.MM.BB`

## Version Format

- **YYYY**: Year (e.g., 2025)
- **MM**: Month (01-12)
- **BB**: Build number within that month (01, 02, 03, etc.)

Example versions:
- `Alpha 2025.11.01` - First build in November 2025
- `Alpha 2025.11.02` - Second build in November 2025
- `Alpha 2025.12.01` - First build in December 2025

## How to Bump Version

### Using GitHub Actions (Recommended)

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select **"Version Bump"** workflow from the left sidebar
4. Click **"Run workflow"** button (top right)
5. Click the green **"Run workflow"** button in the dropdown

The workflow will:
- Automatically calculate the next version based on the current date
- Increment the build number if it's the same month
- Reset to `.01` if it's a new month
- Commit the updated `version.json` file
- Trigger the deployment workflow automatically

### Version Storage

The version is stored in `version.json`:
```json
{
  "version": "2025.11.01",
  "stage": "Alpha"
}
```

## How It Works

1. **Version Bump Workflow** (`.github/workflows/version-bump.yml`)
   - Manually triggered from GitHub Actions
   - Reads current version from `version.json`
   - Auto-calculates next version
   - Commits the change to main branch

2. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Automatically triggered by the version bump commit
   - Reads version from `version.json`
   - Injects version as `VITE_APP_VERSION` environment variable
   - Builds and deploys to GitHub Pages

3. **Build Time Injection** (`vite.config.ts`)
   - Vite reads `VITE_APP_VERSION` from environment
   - Replaces `import.meta.env.VITE_APP_VERSION` at build time

4. **UI Display** (`src/routes/+page.svelte`)
   - Footer displays the injected version
   - Fallback to "Alpha v0.0.1" during local development

## Local Development

When running locally with `npm run dev`, the version will display as "Alpha v0.0.1" (the fallback). The actual version will only appear in the deployed build.

To test with a specific version locally:
```bash
VITE_APP_VERSION="Alpha 2025.11.01" npm run build
npm run preview
```

## Manual Version Updates

If you need to manually set a version:

1. Edit `version.json`:
```json
{
  "version": "2025.12.05",
  "stage": "Beta"
}
```

2. Commit and push:
```bash
git add version.json
git commit -m "Bump version to Beta 2025.12.05"
git push
```

The deploy workflow will automatically run and use the new version.
