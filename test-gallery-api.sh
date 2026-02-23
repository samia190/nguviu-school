#!/bin/bash
# Test what URLs are actually returned by the gallery API

echo "Testing /api/content/gallery endpoint..."
curl -s http://localhost:4000/api/content/gallery 2>&1 | head -100 | jq '.[] | {title: .title, attachmentCount: (.attachments | length), firstUrl: .attachments[0].url}' 2>/dev/null || echo "API not responding or jq not available"
