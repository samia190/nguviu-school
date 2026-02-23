@echo off
REM Test upload flow

echo.
echo Testing Image Upload Flow
echo.

REM Step 1: Create test image
echo Step 1 - Creating test image...
REM Just use an existing image from the uploads folder
set TESTIMG=C:\Users\User\OneDrive\Desktop\vrs 1.2.2 ksc copy\kscbackend\public\uploads\1771840325075-DSC_5353.webp

if not exist "%TESTIMG%" (
    echo ERROR: Test image not found!
    exit /b 1
)

echo.
echo Step 2 - Uploading to /api/files/upload...

REM Upload
curl -X POST -F "file=@%TESTIMG%" http://localhost:4000/api/files/upload > upload-response.json 2>&1

REM Parse response
for /f "tokens=2 delims=:," %%a in ('findstr /i "url" upload-response.json') do (
    set UPLOADED_URL=%%a
)

REM Clean up the URL
set UPLOADED_URL=%UPLOADED_URL:"=%
set UPLOADED_URL=%UPLOADED_URL:  =%
set UPLOADED_URL=%UPLOADED_URL:         =%

echo Response file contents:
type upload-response.json

echo.
echo Step 3 - Sending to /api/home-news...

REM Create JSON body
(
    echo {
    echo   "title": "Test Upload",
    echo   "description": "Testing",
    echo   "imageUrl": "%UPLOADED_URL%",
    echo   "category": "news"
    echo }
) > news-body.json

REM Send to backend
curl -X POST -H "Content-Type: application/json" -d @news-body.json http://localhost:4000/api/home-news > news-response.json 2>&1

echo Response:
type news-response.json

REM Cleanup
del upload-response.json news-body.json news-response.json
