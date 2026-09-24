async function verify() {
  try {
    const ogRes = await fetch('https://land-intel-omega.vercel.app/og-image.png');
    console.log('OG Image Status:', ogRes.status, ogRes.headers.get('content-type'), ogRes.headers.get('content-length'));

    const homeRes = await fetch('https://land-intel-omega.vercel.app/');
    const html = await homeRes.text();

    console.log('Homepage Status:', homeRes.status);
    console.log('GA4 Script Included:', html.includes('googletagmanager.com/gtag/js'));
    console.log('Cookie Consent Handled:', html.includes('landintel_cookie_consent'));
    
    const ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*>/gi);
    console.log('OG Image Meta Tag:', ogImg ? ogImg[0] : 'None');

    const twImg = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*>/gi);
    console.log('Twitter Image Meta Tag:', twImg ? twImg[0] : 'None');
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

verify();
