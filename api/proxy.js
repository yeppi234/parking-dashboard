// api/proxy.js
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

  // OPTIONS 요청 (프리플라이트) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ✅ req.url에서 /api/proxy 부분을 제거하고 실제 경로만 추출
    let targetPath = req.url;
    if (targetPath.startsWith('/api/proxy')) {
      targetPath = targetPath.replace('/api/proxy', '');
    }
    
    // 실제 타겟 URL 생성
    const targetUrl = 'https://a17574.parkingweb.kr' + targetPath;
    
    const cookie = req.headers.cookie || '';

    // POST 요청인 경우 body 읽기
    let body = req.body;
    if (req.method === 'POST') {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        body = new URLSearchParams(req.body).toString();
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: req.method === 'POST' ? body : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error: ' + error.message });
  }
}
