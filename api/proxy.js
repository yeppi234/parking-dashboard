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

    // ✅ POST body 처리 (중요!)
    let body = req.body;
    if (req.method === 'POST') {
      // body가 객체인 경우 URLSearchParams로 변환
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          // 배열인 경우 여러 번 추가
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
        body = params.toString();
      }
    }

    console.log('🔑 Proxy target:', targetUrl);
    console.log('📦 Body:', body);
    console.log('🍪 Cookie:', cookieHeader);

    // 대상 서버로 요청 전달
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: req.method === 'POST' ? body : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      details: error.message 
    });
  }
}
