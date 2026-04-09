# Git Auto-Sync Script for MTA Project
# Use: .\sync-to-github.ps1

$interval = 30 # seconds between checks
Write-Host "🚀 MTA Project Auto-Sync Started!" -ForegroundColor Cyan
Write-Host "Watching for changes in: $(Get-Location)" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor Yellow

while ($true) {
    # Check if there are any changes (staged or unstaged)
    $status = git status --porcelain
    
    if ($status) {
        Write-Host "[$(Get-Date -Format "HH:mm:ss")] 🛠️ Changes detected. Syncing..." -ForegroundColor Blue
        
        # Add all changes
        git add .
        
        # Commit with a timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git commit -m "Auto-update: $timestamp"
        
        # Push to GitHub
        try {
            git push origin main
            Write-Host "✅ Successfully pushed to GitHub.`n" -ForegroundColor Green
        } catch {
            Write-Host "❌ Push failed. Will retry in $interval seconds." -ForegroundColor Red
        }
    }

    Start-Sleep -Seconds $interval
}
