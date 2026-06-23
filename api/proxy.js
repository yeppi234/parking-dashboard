// api/proxy.js
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 실제 타겟 URL 생성
    const targetPath = req.url.replace('/api/proxy', '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    const cookie = req.headers.cookie || '';

    // ✅ body를 그대로 전달 (가공하지 않음)
    let body = req.body;

    // Vercel이 body를 객체로 파싱한 경우 URLSearchParams로 변환
    if (req.method === 'POST' && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      body = new URLSearchParams(req.body).toString();
    }

    console.log('🔑 Proxy target:', targetUrl);
    console.log('📦 Body:', body); // Vercel 로그에서 확인 가능

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
    res.status(500).json({ 
      error: 'Proxy error', 
      details: error.message 
    });
  }
}
