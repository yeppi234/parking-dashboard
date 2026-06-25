export default async function handler(req, res) {
  // CORS 헤더 설정 (모든 응답에 포함)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS 요청 처리 (프리플라이트)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청 처리 (상태 확인용)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Proxy is running' });
  }

  // POST 요청만 프록시 처리
  if (req.method === 'POST') {
    try {
      const targetUrl = `https://a17574.parkingweb.kr${req.url}`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
          'Cookie': req.headers.cookie || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: req.body, // 이미 파싱된 body 사용 (Vercel에서 자동 파싱)
      });

      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
    return;
  }

  // 지원하지 않는 메서드
  res.status(405).json({ error: 'Method Not Allowed' });
}
