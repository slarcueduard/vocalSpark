# Vocal Spark - Deployment Script
# Automates version bump, merge to main, and deployment

Write-Host "🚀 Vocal Spark Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "develop") {
    Write-Host "❌ Error: You must be on 'develop' branch to deploy" -ForegroundColor Red
    Write-Host "   Current branch: $currentBranch" -ForegroundColor Yellow
    Write-Host "   Run: git checkout develop" -ForegroundColor Yellow
    exit 1
}

# 2. Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "❌ Error: You have uncommitted changes" -ForegroundColor Red
    Write-Host "   Please commit or stash your changes first" -ForegroundColor Yellow
    git status --short
    exit 1
}

# 3. Get current version
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "📦 Current version: v$currentVersion" -ForegroundColor Green

# 4. Ask for version bump type
Write-Host ""
Write-Host "Select release type:" -ForegroundColor Yellow
Write-Host "  [1] Patch (bug fixes)         - v$currentVersion → v" -NoNewline
$patchVer = $currentVersion -replace '(\d+\.\d+\.)(\d+)', { "$($matches[1])$([int]$matches[2] + 1)" }
Write-Host "$patchVer" -ForegroundColor Cyan
Write-Host "  [2] Minor (new features)      - v$currentVersion → v" -NoNewline
$minorVer = $currentVersion -replace '(\d+\.)(\d+)(\.\d+)', { "$($matches[1])$([int]$matches[2] + 1).0" }
Write-Host "$minorVer" -ForegroundColor Cyan
Write-Host "  [3] Major (breaking changes)  - v$currentVersion → v" -NoNewline
$majorVer = $currentVersion -replace '(\d+)(\.\d+\.\d+)', { "$([int]$matches[1] + 1).0.0" }
Write-Host "$majorVer" -ForegroundColor Cyan
Write-Host "  [0] Cancel" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1/2/3/0)"

switch ($choice) {
    "1" { $newVersion = $patchVer; $releaseType = "patch" }
    "2" { $newVersion = $minorVer; $releaseType = "minor" }
    "3" { $newVersion = $majorVer; $releaseType = "major" }
    "0" { Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow; exit 0 }
    default { Write-Host "❌ Invalid choice" -ForegroundColor Red; exit 1 }
}

Write-Host ""
Write-Host "🎯 Deploying version: v$newVersion ($releaseType)" -ForegroundColor Magenta
Write-Host ""

# 5. Update package.json version
Write-Host "📝 Updating package.json..." -ForegroundColor Yellow
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✅ Version updated to v$newVersion" -ForegroundColor Green

# 6. Commit version bump
Write-Host "💾 Committing version bump..." -ForegroundColor Yellow
git add package.json
git commit -m "chore: Bump version to v$newVersion"
Write-Host "✅ Version committed" -ForegroundColor Green

# 7. Merge to main
Write-Host "🔀 Merging develop → main..." -ForegroundColor Yellow
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to checkout main branch" -ForegroundColor Red
    git checkout develop
    exit 1
}

git merge develop -m "Release v$newVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Merge failed! Aborting..." -ForegroundColor Red
    git merge --abort
    git checkout develop
    exit 1
}
Write-Host "✅ Merged to main" -ForegroundColor Green

# 8. Create tag
Write-Host "🏷️  Creating tag v$newVersion..." -ForegroundColor Yellow
git tag -a "v$newVersion" -m "Release v$newVersion"
Write-Host "✅ Tag created" -ForegroundColor Green

# 9. Push to GitHub
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
git push origin --tags
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Push failed. You may need to authenticate." -ForegroundColor Yellow
    Write-Host "   Try: gh auth login" -ForegroundColor Yellow
}  else {
    Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
}

# 10. Switch back to develop
git checkout develop
Write-Host "✅ Back on develop branch" -ForegroundColor Green

# 11. Success message
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Version:  v$newVersion" -ForegroundColor White
Write-Host "GitHub:   https://github.com/slarcueduard/vocalSpark" -ForegroundColor White
Write-Host "Vercel:   https://vercel.com/slarcueduard/vocalspark" -ForegroundColor White
Write-Host "Live:     https://vocalspark.io" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Vercel is deploying... Check dashboard for status" -ForegroundColor Yellow
Write-Host ""
