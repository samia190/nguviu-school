#!/usr/bin/env node

/**
 * End-to-End Upload Flow Test
 * Tests: upload → JSON POST → database storage
 * Captures: Console logs from all three stages
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:4000";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function testUploadFlow() {
  log(colors.cyan, "\n========== END-TO-END UPLOAD FLOW TEST ==========\n");

  try {
    // Step 1: Test the debug upload endpoint
    log(colors.blue, "📤 STEP 1: Testing /api/files/test-upload endpoint");
    log(colors.yellow, "   This tests what URLs are returned from the upload endpoint\n");

    // Create a test file
    const testFilePath = path.join("kscbackend/public/uploads/e2e-test.txt");
    fs.writeFileSync(testFilePath, "Test file for E2E upload flow");

    const form = new FormData();
    form.append("file", fs.createReadStream(testFilePath));

    try {
      const uploadResponse = await axios.post(`${API_BASE}/api/files/test-upload`, form, {
        headers: form.getHeaders()
      });

      log(colors.green, "✓ Upload endpoint responded");
      log(colors.blue, "\n   Response data:");
      console.table(uploadResponse.data);

      const { relativeUrl, absoluteUrl } = uploadResponse.data;

      // Check the URLs
      if (!absoluteUrl.startsWith("http")) {
        log(colors.red, "   ❌ ERROR: absoluteUrl is not absolute! Value:", absoluteUrl);
      } else {
        log(colors.green, "   ✓ absoluteUrl is correct (starts with http://)");
      }

      if (!relativeUrl.startsWith("/")) {
        log(colors.red, "   ❌ ERROR: relativeUrl should start with /! Value:", relativeUrl);
      } else {
        log(colors.green, "   ✓ relativeUrl is correct (starts with /)");
      }

      // Step 2: Test regular upload endpoint
      log(colors.blue, "\n📤 STEP 2: Testing regular /api/files/upload endpoint\n");

      const form2 = new FormData();
      form2.append("file", fs.createReadStream(testFilePath));

      const uploadResponse2 = await axios.post(`${API_BASE}/api/files/upload`, form2, {
        headers: form2.getHeaders()
      });

      log(colors.green, "✓ Regular upload endpoint responded");
      console.table(uploadResponse2.data);

      const regularUrl = uploadResponse2.data.url;
      if (!regularUrl.startsWith("http")) {
        log(colors.red, "   ❌ ERROR: Regular upload returns relative URL! Value:", regularUrl);
        log(colors.red, "   This means the frontend will receive a relative URL");
      } else {
        log(colors.green, "   ✓ Regular upload returns absolute URL");
      }

      // Step 3: Simulate what frontend sends to backend
      log(colors.blue, "\n📝 STEP 3: Simulating frontend POST to /api/home-news\n");
      log(colors.yellow, "   Frontend will send imageUrl:", regularUrl);

      const newsData = {
        title: "E2E Test News Item",
        description: "Testing the complete upload flow",
        imageUrl: regularUrl // This is what frontend sends
      };

      log(colors.yellow, "   Posting data to backend:");
      console.table(newsData);

      try {
        const newsResponse = await axios.post(`${API_BASE}/api/home-news`, newsData);
        log(colors.green, "✓ Backend created news item");
        console.table({
          storedImageUrl: newsResponse.data.imageUrl,
          responseImageUrl: newsResponse.data.imageUrl,
          newsId: newsResponse.data._id
        });

        // Step 4: Fetch the item back from database
        log(colors.blue, "\n🔍 STEP 4: Fetching the item back from database\n");

        const fetchResponse = await axios.get(`${API_BASE}/api/home-news/${newsResponse.data._id}`);
        log(colors.green, "✓ Fetched item from database");
        console.table({
          storedInDB: fetchResponse.data.imageUrl || "(check backend logs)",
          returnedToFrontend: fetchResponse.data.imageUrl
        });

        // Step 5: Summary
        log(colors.cyan, "\n========== SUMMARY ==========\n");

        log(
          colors.green,
          "✓ Upload Flow appears to be working"
        );
        log(colors.yellow, "   Check backend console for DEBUG logs to see exact URL transformations");
        log(colors.yellow, "   Look for lines starting with: 🔍 DEBUG:");

        // Cleanup
        fs.unlinkSync(testFilePath);
      } catch (error) {
        log(colors.red, "❌ Error posting to /api/home-news:");
        console.error(error.response?.data || error.message);
      }
    } catch (error) {
      log(colors.red, "❌ Error uploading file:");
      console.error(error.response?.data || error.message);
    }
  } catch (error) {
    log(colors.red, "❌ Test failed:");
    console.error(error.message);
  }
}

// Check if server is running
axios
  .get(`${API_BASE}/api/health`)
  .then(() => {
    testUploadFlow();
  })
  .catch(() => {
    log(colors.red, "❌ Backend server is not running!");
    log(colors.yellow, "   Please start the backend with: npm start (in kscbackend folder)");
    log(colors.yellow, "   Then run this test again");
  });
