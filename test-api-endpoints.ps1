# API Endpoint Testing Script
# Tests all backend API endpoints to ensure they're working correctly

$API_BASE_URL = "http://10.1.170.93:3000/api"
$TEST_PHONE = "9876543210"
$TEST_EMAIL = "test@example.com"

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 API Endpoint Testing" -ForegroundColor Green
Write-Host "Base URL: $API_BASE_URL" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to make API request and display result
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [hashtable]$Headers = @{"Content-Type"="application/json"},
        [bool]$RequiresAuth = $false
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "  → $Method $API_BASE_URL$Endpoint" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = "$API_BASE_URL$Endpoint"
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body.Count -gt 0) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        Write-Host "  ✅ Success ($($response.StatusCode))" -ForegroundColor Green
        
        # Parse and display response
        $content = $response.Content | ConvertFrom-Json
        Write-Host "  Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor Gray
        Write-Host ""
        
        return @{
            success = $true
            data = $content
            statusCode = $response.StatusCode
        }
    }
    catch {
        Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "  Status Code: $statusCode" -ForegroundColor Red
        }
        Write-Host ""
        
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

# Test 1: Send OTP
Write-Host "1️⃣  Auth Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
$otpResult = Test-Endpoint -Name "Send OTP" -Method "POST" -Endpoint "/auth/send-otp" -Body @{
    phone = $TEST_PHONE
}

if ($otpResult.success) {
    $otp = $otpResult.data.otp
    Write-Host "  💡 OTP for testing: $otp" -ForegroundColor Magenta
    
    # Test 2: Verify OTP
    Start-Sleep -Seconds 1
    $verifyResult = Test-Endpoint -Name "Verify OTP" -Method "POST" -Endpoint "/auth/verify-otp" -Body @{
        phone = $TEST_PHONE
        otp = $otp
    }
    
    # Test 3: Signup (only if user is new)
    if ($verifyResult.success -and $verifyResult.data.isNewUser) {
        Start-Sleep -Seconds 1
        $signupResult = Test-Endpoint -Name "Signup" -Method "POST" -Endpoint "/auth/signup" -Body @{
            phone = $TEST_PHONE
            otp = $otp
            firstName = "Test"
            lastName = "User"
            email = $TEST_EMAIL
            gender = "male"
            state = "Delhi"
            city = "New Delhi"
            role = "artist"
        }
        
        if ($signupResult.success) {
            $token = $signupResult.data.access_token
            Write-Host "  💡 Auth Token: $($token.Substring(0, 20))..." -ForegroundColor Magenta
            
            # Test 4: Get Profile (requires auth)
            Start-Sleep -Seconds 1
            $authHeaders = @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $token"
            }
            Test-Endpoint -Name "Get Auth Profile" -Method "GET" -Endpoint "/auth/profile" -Headers $authHeaders -RequiresAuth $true
        }
    }
}

# Test 5: Posts Endpoints
Write-Host ""
Write-Host "2️⃣  Posts Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Test-Endpoint -Name "List Posts" -Method "GET" -Endpoint "/posts?limit=5"

# Test 6: Profiles Endpoints
Write-Host ""
Write-Host "3️⃣  Profiles Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Test-Endpoint -Name "List Profiles" -Method "GET" -Endpoint "/profiles?limit=5"

# Test 7: Projects Endpoints
Write-Host ""
Write-Host "4️⃣  Projects Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Test-Endpoint -Name "List Projects" -Method "GET" -Endpoint "/projects?limit=5"

# Test 8: Schedules Endpoints
Write-Host ""
Write-Host "5️⃣  Schedules Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Test-Endpoint -Name "List Schedules" -Method "GET" -Endpoint "/schedules?limit=5"

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ API Testing Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart your Expo app to pick up the new .env file" -ForegroundColor White
Write-Host "2. Clear Expo cache: npx expo start --clear" -ForegroundColor White
Write-Host "3. Make sure your phone/emulator is on the same network (10.1.x.x)" -ForegroundColor White
Write-Host ""

