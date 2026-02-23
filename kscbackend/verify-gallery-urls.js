import http from 'http';

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/content/gallery',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

http.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const items = JSON.parse(data);
      if (items.length > 0) {
        console.log('✅ Gallery API Response OK');
        console.log(`📊 Items: ${items.length}`);
        
        const firstItem = items[0];
        const firstAttachment = firstItem.attachments?.[0];
        
        if (firstAttachment) {
          console.log(`\n📸 First attachment URL: ${firstAttachment.url}`);
          console.log(`   Mimetype: ${firstAttachment.mimetype}`);
          
          // Construct absolute URL as Gallery.jsx does
          const absUrl = `http://localhost:4000${firstAttachment.url.startsWith('/') ? firstAttachment.url : '/' + firstAttachment.url}`;
          console.log(`   Absolute URL: ${absUrl}`);
          
          // Test if it's accessible
          const imgOptions = {
            hostname: 'localhost',
            port: 4000,
            path: firstAttachment.url,
            method: 'HEAD'
          };
          
          http.get(imgOptions, (imgRes) => {
            console.log(`\n✅ Image accessible at: ${imgRes.statusCode}`);
            console.log('   CORS Headers:');
            console.log(`   - Access-Control-Allow-Origin: ${imgRes.headers['access-control-allow-origin'] || 'Not set'}`);
            console.log(`   - Content-Type: ${imgRes.headers['content-type']}`);
            console.log('\n🎉 All images should now load correctly on the public gallery!');
          }).on('error', (e) => {
            console.error('❌ Image not accessible:', e.message);
          });
        }
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('❌ API Error:', e.message);
});
