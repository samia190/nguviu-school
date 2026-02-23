# Test upload flow using PowerShell

$backendUrl = "http://localhost:4000"

Write-Host "Testing Image Upload Flow" -ForegroundColor Cyan

# Step 1: Create a small test JPG file
Write-Host "Step 1 - Creating test image..." -ForegroundColor Yellow
$testImagePath = "$PSScriptRoot\test-image.jpg"

# Minimal JPEG header bytes
$jpegBytes = @(
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
)
[System.IO.File]::WriteAllBytes($testImagePath, $jpegBytes)
Write-Host "Test image created`n"

# Step 2: Upload
Write-Host "Step 2 - Uploading to /api/files/upload..." -ForegroundColor Yellow

try {
    $fileStream = [System.IO.File]::OpenRead($testImagePath)
    $fileName = [System.IO.Path]::GetFileName($testImagePath)
    $fileCollection = @()
    $fileCollection += $fileStream
    
    $response = Invoke-WebRequest -Uri "$backendUrl/api/files/upload" `
        -Method POST `
        -Form @{file = $fileStream } `
        -ErrorAction Stop
    
    $uploadData = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($uploadData | ConvertTo-Json -Depth 5)`n"
    
    if (-not $uploadData.url) {
        Write-Host "❌ ERROR: No URL in upload response!" -ForegroundColor Red
        exit 1
    }
    
    $uploadedUrl = $uploadData.url
    Write-Host "✅ Uploaded URL: $uploadedUrl"
    Write-Host "   Starts with http?: $($uploadedUrl.StartsWith('http'))`n"
    
    $fileStream.Close()
    
    # Step 3: Send to /api/home-news
    Write-Host "Step 3️⃣  - Sending to /api/home-news..." -ForegroundColor Yellow
    
    $newsBody = @{
        title = "Test Upload Flow"
        description = "Testing image upload chain"
        imageUrl = $uploadedUrl
        category = "news"
    } | ConvertTo-Json
    
    $newsResponse = Invoke-WebRequest -Uri "$backendUrl/api/home-news" `
        -Method POST `
        -ContentType "application/json" `
        -Body $newsBody `
        -ErrorAction Stop
    
    $newsData = $newsResponse.Content | ConvertFrom-Json
    Write-Host "Status: $($newsResponse.StatusCode)"
    
    if ($newsData._id) {
        Write-Host "✅ News item created: $($newsData._id)"
        Write-Host "   Stored imageUrl: $($newsData.imageUrl)"
        Write-Host "   URL type: $(if ($newsData.imageUrl.StartsWith('http')) { 'ABSOLUTE' } else { 'RELATIVE' })`n"
        
        # Step 4: Fetch back
        Write-Host "Step 4️⃣  - Fetching back from /api/home-news/:id..." -ForegroundColor Yellow
        
        $fetchResponse = Invoke-WebRequest -Uri "$backendUrl/api/home-news/$($newsData._id)" `
            -Method GET `
            -ErrorAction Stop
        
        $fetchData = $fetchResponse.Content | ConvertFrom-Json
        Write-Host "Retrieved imageUrl: $($fetchData.imageUrl)"
        Write-Host "   URL type: $(if ($fetchData.imageUrl.StartsWith('http')) { 'ABSOLUTE' } else { 'RELATIVE' })`n"
        
        # Summary
        Write-Host "✨ SUMMARY:" -ForegroundColor Green
        Write-Host "1. Upload returned: $(if ($uploadedUrl.StartsWith('http')) { 'ABSOLUTE' } else { 'RELATIVE' })"
        Write-Host "   URL: $uploadedUrl"
        Write-Host "2. Sent to backend: $(if ($uploadedUrl.StartsWith('http')) { 'ABSOLUTE' } else { 'RELATIVE' })"
        Write-Host "3. Stored in DB: $(if ($newsData.imageUrl.StartsWith('http')) { 'ABSOLUTE' } else { 'RELATIVE' })"
        Write-Host "   URL: $($newsData.imageUrl)"
        Write-Host "4. Fetched from DB: $(if ($fetchData.imageUrl.StartsWith('http')) { 'ABSOLUTE' } else { 'RELATIVE' })"
        Write-Host "   URL: $($fetchData.imageUrl)`n"
        
        if ($uploadedUrl.StartsWith('http') -and -not $newsData.imageUrl.StartsWith('http')) {
            Write-Host "⚠️  WARNING: Image URL lost absolute path when saving to database!" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item $testImagePath -Force -ErrorAction SilentlyContinue
}
