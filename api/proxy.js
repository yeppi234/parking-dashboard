// api/proxy.js - 가장 단순하고 안정적인 프록시
export default async function handler(req, res) {
  // CORS 헤더 설정 (모든 도메인 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS (프리플라이트) 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청은 프록시하지 않음 (필요하면 추가 가능)
  if (req.method === 'GET') {
    return res.status(405).json({ error: 'GET method not supported' });
  }

  try {
    // 실제 대상 URL 구성 (예: /api/proxy/login → /login)
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    // 요청 본문(body)을 그대로 사용 (가공하지 않음)
    // Vercel은 req.body를 자동으로 파싱하지만, 여기서는 그대로 전달
    let body = req.body;

    // 만약 body가 객체라면 URLSearchParams로 변환 (POST 폼 데이터)
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        params.append(key, value);
      }
      body = params.toString();
    }

    // 대상 서버로 요청 전달
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': req.headers.cookie || '',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body,
    });

    // 응답을 그대로 클라이언트에 전달
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy server error',
      message: error.message,
    });
  }
}
