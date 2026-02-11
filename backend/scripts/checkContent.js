(async () => {
  try {
    const homeRes = await fetch('http://localhost:4000/api/content/home');
    const home = await homeRes.json();
    console.log('--- HOME ---');
    console.log(JSON.stringify(home, null, 2));

    const aboutRes = await fetch('http://localhost:4000/api/content/about');
    const about = await aboutRes.json();
    console.log('--- ABOUT ---');
    console.log(JSON.stringify(about, null, 2));
  } catch (err) {
    console.error('Fetch failed:', err);
    process.exitCode = 1;
  }
})();
