# Vocal Spark - Rollback Script
# Emergency rollback to previous version

Write-Host "⏪ Vocal Spark Rollback Script" -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red
Write-Host ""

# 1. Get recent tags
Write-Host "📋 Available versions:" -ForegroundColor Yellow
Write-Host ""

$tags = git tag --sort=-version:refname | Select-Object -First 10
if (-not $tags) {
    Write-Host "❌ No version tags found" -ForegroundColor Red
    exit 1
}

$tagList = @()
$index = 1
foreach ($tag in $tags) {
    $tagList += $tag
    $date = git log -1 --format=%ai $tag
    Write-Host "  [$index] $tag" -NoNewline
    Write-Host " - " -NoNewline -ForegroundColor Gray
    Write-Host "$date" -ForegroundColor Gray
    $index++
}

Write-Host "  [0] Cancel" -ForegroundColor Gray
Write-Host ""

# 2. Select version
$choice = Read-Host "Select version to rollback to (1-$($tagList.Count)/0)"

if ($choice -eq "0") {
    Write-Host "❌ Rollback cancelled" -ForegroundColor Yellow
    exit 0
}

$selectedIndex = [int]$choice - 1
if ($selectedIndex -lt 0 -or $selectedIndex -ge $tagList.Count) {
    Write-Host "❌ Invalid selection" -ForegroundColor Red
    exit 1
}

$targetVersion = $tagList[$selectedIndex]
Write-Host ""
Write-Host "⚠️  WARNING: This will rollback to $targetVersion" -ForegroundColor Red
Write-Host "   Current production will be replaced!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Are you sure? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Rollback cancelled" -ForegroundColor Yellow
    exit 0
}

# 3. Checkout main
Write-Host ""
Write-Host "🔀 Switching to main branch..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to checkout main" -ForegroundColor Red
    exit 1
}

# 4. Reset to selected tag
Write-Host "⏪ Rolling back to $targetVersion..." -ForegroundColor Yellow
git reset --hard $targetVersion
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rollback failed" -ForegroundColor Red
    git checkout $currentBranch
    exit 1
}
Write-Host "✅ Rolled back to $targetVersion" -ForegroundColor Green

# 5. Force push to GitHub
Write-Host "⬆️  Force pushing to GitHub..." -ForegroundColor Yellow
Write-Host "   This will trigger Vercel deployment..." -ForegroundColor Gray
git push origin main --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Push failed" -ForegroundColor Yellow
    Write-Host "   Production may not have updated" -ForegroundColor Yellow
} else {
    Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
}

# 6. Sync develop with main
Write-Host "🔄 Syncing develop branch..." -ForegroundColor Yellow
git checkout develop
git reset --hard main
git push origin develop --force
Write-Host "✅ Develop synced with main" -ForegroundColor Green

# 7. Success message
Write-Host ""
Write-Host "==============================" -ForegroundColor Red
Write-Host "✅ Rollback Complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Red
Write-Host "Rolled back to: $targetVersion" -ForegroundColor White
Write-Host "Production:     https://vocalspark.io" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Vercel is deploying... Check dashboard" -ForegroundColor Yellow
Write-Host ""
