// api/proxy.js
export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    // 쿠키
    const cookieHeader = req.headers.cookie || '';

    // Body 처리
    let body = '';
    if (req.body) {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        body = req.body.toString('utf-8');
      } else if (typeof req.body === 'object') {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          params.append(key, value);
        }
        body = params.toString();
      }
    }

    console.log('🔑 Target URL:', targetUrl);
    console.log('📦 Body:', body);
    console.log('🍪 Cookie:', cookieHeader);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      },
      body: body || undefined,
    });

    // ✅ 서버 응답 디버깅
    const data = await response.text();
    console.log('📤 Response Status:', response.status);
    console.log('📤 Response Body:', data.substring(0, 200)); // 앞 200자만 로그

    res.status(response.status).send(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      details: error.message,
    });
  }
}
