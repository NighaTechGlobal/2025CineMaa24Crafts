# Restart Expo with Clean Cache - Enhanced Version
# This script stops all node processes, clears cache, and restarts Expo

Write-Host "🛑 Stopping any running Expo/Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "expo" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "🧹 Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}
if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro" -ErrorAction SilentlyContinue
}

Write-Host "🧹 Clearing React Native cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\react-native-*") {
    Remove-Item -Recurse -Force "$env:TEMP\react-native-*" -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item -Recurse -Force "$env:TEMP\metro-*" -ErrorAction SilentlyContinue
}

Write-Host "🧹 Clearing Watchman cache (if installed)..." -ForegroundColor Yellow
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all 2>$null
}

Write-Host "🚀 Starting Expo with cleared cache..." -ForegroundColor Green
npx expo start --clear --reset-cache

