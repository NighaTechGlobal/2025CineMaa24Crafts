# Get local IP address for Expo development
$ip = Get-NetIPAddress -AddressFamily IPv4 | 
      Where-Object { $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" } | 
      Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
      Select-Object -First 1 -ExpandProperty IPAddress

if ($ip) {
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Your PC's LAN IP Address: $ip" -ForegroundColor Green
    Write-Host "Backend should be accessible at: http://${ip}:3000" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run these commands to start Expo with the correct API URL:" -ForegroundColor White
    Write-Host ""
    Write-Host "`$env:EXPO_PUBLIC_API_BASE_URL=`"http://${ip}:3000`"" -ForegroundColor Magenta
    Write-Host "npx expo start --lan --clear" -ForegroundColor Magenta
    Write-Host ""
} else {
    Write-Host "Could not find LAN IP address. Make sure you're connected to Wi-Fi." -ForegroundColor Red
}

