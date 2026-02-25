#!/usr/bin/env node
/**
 * Verify API Endpoints are Working
 * Tests all the endpoints the frontend is trying to use
 * Note: Using native fetch from Node.js v18+
 */

const API_URL = 'http://localhost:4000';

const endpoints = [
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/staff?type=principal', name: 'Get Principal' },
  { method: 'GET', path: '/api/staff?type=deputy_principal', name: 'Get Deputies' },
  { method: 'GET', path: '/api/staff', name: 'Get All Staff' },
  { method: 'GET', path: '/api/performance/public', name: 'Get Performance (Public)' },
  { method: 'GET', path: '/api/content/contact', name: 'Get Contact Content' },
  { method: 'GET', path: '/api/content/summary/contact', name: 'Get Contact Summary' },
  { method: 'GET', path: '/api/content/about', name: 'Get About Content' },
  { method: 'GET', path: '/api/hero-content?page=about', name: 'Get Hero Content (About)' },
  { method: 'GET', path: '/api/files', name: 'Get Files' },
  { method: 'GET', path: '/api/home-news?active=true', name: 'Get Home News' },
];

async function testEndpoint(endpoint) {
  try {
    const url = `${API_URL}${endpoint.path}`;
    const response = await fetch(url, { method: endpoint.method });
    const data = response.ok ? await response.json() : null;
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${response.status.toString().padEnd(3)} | ${endpoint.name.padEnd(30)} | ${endpoint.path}`);
    
    return {
      path: endpoint.path,
      status: response.status,
      ok: response.ok,
      data: data?.length || Object.keys(data || {}).length
    };
  } catch (error) {
    console.log(`❌ ERR  | ${endpoint.name.padEnd(30)} | ${endpoint.path}`);
    console.log(`         └─ ${error.message}`);
    return {
      path: endpoint.path,
      error: error.message,
      ok: false
    };
  }
}

async function main() {
  console.log('\n🧪 TESTING API ENDPOINTS\n');
  console.log(`Target: ${API_URL}\n`);
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successful = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  
  console.log(`\n${'-'.repeat(80)}`);
  console.log(`✅ Successful: ${successful}/${endpoints.length}`);
  console.log(`❌ Failed: ${failed}/${endpoints.length}`);
  
  if (failed > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`   - ${r.path}: ${r.error || `HTTP ${r.status}`}`);
    });
    console.log('\n💡 Make sure the backend is running with: npm run dev (in kscbackend)');
  } else {
    console.log('\n✨ All endpoints are working!');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

main();
