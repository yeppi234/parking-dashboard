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
    // ✅ 실제 대상 URL 생성
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    // ✅ 쿠키 전달
    const cookieHeader = req.headers.cookie || '';

    // ✅ POST body 처리
    let body = req.body;
    if (req.method === 'POST') {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          params.append(key, value);
        }
        body = params.toString();
      }
    }

    // ✅ 대상 서버로 요청 전달 (메서드 그대로)
    const response = await fetch(targetUrl, {
      method: req.method, // 클라이언트의 메서드를 그대로 사용
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
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
