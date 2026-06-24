// api/proxy.js
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 실제 대상 URL 생성
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    // 쿠키 전달
    const cookieHeader = req.headers.cookie || '';

    // ✅ POST body 처리 (강화)
    let body = null;
    if (req.method === 'POST') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        body = req.body.toString('utf-8');
      } else if (typeof req.body === 'object' && req.body !== null) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
        body = params.toString();
      }
    }

    console.log('🔑 Target URL:', targetUrl);
    console.log('📦 Method:', req.method);
    console.log('📦 Body:', body);
    console.log('🍪 Cookie:', cookieHeader);

    // ✅ 대상 서버로 요청 전달 (메서드 강제 POST)
    const response = await fetch(targetUrl, {
      method: 'POST', // 무조건 POST로 고정
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      },
      body: body,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
