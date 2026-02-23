#!/bin/bash

# Test the /api/files/test-upload endpoint to see what URLs are returned

echo "🔍 Testing /api/files/test-upload endpoint..."
echo ""

# First, check if there's a test image file we can use
TEST_FILE="kscbackend/public/uploads/test-image.txt"
if [ ! -f "$TEST_FILE" ]; then
  echo "Creating test file..."
  mkdir -p kscbackend/public/uploads
  echo "This is a test file" > "$TEST_FILE"
fi

# Use curl to test the upload
echo "Uploading test file..."
RESPONSE=$(curl -s -X POST -F "file=@$TEST_FILE" http://localhost:4000/api/files/test-upload)

echo "Response from /api/files/test-upload:"
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "If you see:"
echo "  - relativeUrl: /uploads/... (correct)"
echo "  - absoluteUrl: http://localhost:4000/uploads/... (correct)"
echo "Then the upload endpoint is working correctly"
