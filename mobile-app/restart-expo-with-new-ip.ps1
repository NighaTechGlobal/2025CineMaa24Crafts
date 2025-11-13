# Script to restart Expo with updated IP address
# This clears cache and reloads environment variables

Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 Restarting Expo with Updated IP" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Get current IP
$ip = Get-NetIPAddress -AddressFamily IPv4 | 
      Where-Object { $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" } | 
      Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
      Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
    Write-Host "❌ Could not find LAN IP address" -ForegroundColor Red
    Write-Host "Make sure you're connected to WiFi" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Current IP Address: $ip" -ForegroundColor Green

# Check .env file
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    # Extract current IP from .env
    if ($envContent -match "EXPO_PUBLIC_API_BASE_URL=http://([0-9.]+):3000") {
        $currentEnvIP = $matches[1]
        Write-Host "📄 .env file IP: $currentEnvIP" -ForegroundColor Yellow
        
        if ($currentEnvIP -ne $ip) {
            Write-Host ""
            Write-Host "⚠️  IP address mismatch detected!" -ForegroundColor Red
            Write-Host "   .env has: $currentEnvIP" -ForegroundColor Red
            Write-Host "   Current IP: $ip" -ForegroundColor Green
            Write-Host ""
            
            $response = Read-Host "Update .env file with current IP? (y/n)"
            if ($response -eq "y" -or $response -eq "Y") {
                # Update .env file
                $envContent = $envContent -replace "EXPO_PUBLIC_API_BASE_URL=http://[0-9.]+:3000", "EXPO_PUBLIC_API_BASE_URL=http://${ip}:3000"
                $envContent | Set-Content $envFile -NoNewline
                Write-Host "✅ Updated .env with IP: $ip" -ForegroundColor Green
            }
        } else {
            Write-Host "✅ .env file has correct IP" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Starting Expo with cleared cache..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔹 This will:" -ForegroundColor White
Write-Host "   • Clear Metro bundler cache" -ForegroundColor Gray
Write-Host "   • Reload environment variables" -ForegroundColor Gray
Write-Host "   • Start on LAN mode" -ForegroundColor Gray
Write-Host ""

# Set environment variable for current session (backup)
$env:EXPO_PUBLIC_API_BASE_URL = "http://${ip}:3000"

Write-Host "Press Ctrl+C to stop Expo when needed" -ForegroundColor Yellow
Write-Host ""

# Start Expo
npx expo start --lan --clear

