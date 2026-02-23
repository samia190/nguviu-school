import http from 'http';

async function checkGallery() {
  http.get('http://localhost:4000/api/content/gallery', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const items = Array.isArray(parsed) ? parsed : parsed.items ? parsed.items : [parsed];
        console.log('Total items:', items.length);
        let totalPhotos = 0;
        items.forEach((item, idx) => {
          const photoCount = item.attachments?.length || 0;
          totalPhotos += photoCount;
          console.log(`\nItem ${idx + 1}: ${item.title || 'Untitled'}`);
          console.log(`  Photos: ${photoCount}`);
          console.log(`  ID: ${item._id}`);
        });
        console.log(`\n📊 TOTAL PHOTOS: ${totalPhotos}`);
      } catch (e) {
        console.log('Raw response:', data.substring(0, 500));
        console.log('Error:', e.message);
      }
    });
  });
}

checkGallery();
