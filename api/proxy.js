import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🔥 proxy.js 실행됨!');
  console.log('📌 메서드:', req.method);
  console.log('📌 URL:', req.url);

  // ============================================================
  // ✅ 테스트용: 모든 GET 요청에 응답
  // ============================================================
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Proxy is working!',
      method: req.method,
      url: req.url,
      path: req.url
    });
  }

  // ============================================================
  // ✅ POST 요청 처리
  // ============================================================
  if (req.method === 'POST') {
    try {
      const path = req.url.replace(/^\/api\/proxy/, '').replace(/^\/api/, '');
      const targetUrl = `https://a17574.parkingweb.kr${path}`;
      
      let body = req.body;
      if (typeof body === 'object' && !(body instanceof Buffer)) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
          params.append(key, value);
        }
        body = params.toString();
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': req.headers.cookie || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: body,
      });

      const data = await response.text();
      return res.status(response.status).send(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
