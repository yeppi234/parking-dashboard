import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ GET /api/proxy/kv - KV 데이터 조회
  if (req.method === 'GET' && req.url === '/api/proxy/kv') {
    try {
      const data = await kv.get('completedCars');
      return res.status(200).json({ data: data || [] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ✅ POST /api/proxy/kv - KV 데이터 저장
  if (req.method === 'POST' && req.url === '/api/proxy/kv') {
    try {
      const { data } = req.body;
      await kv.set('completedCars', JSON.stringify(data), { ex: 86400 });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET 요청 처리 (상태 확인용)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Proxy is running',
      timestamp: new Date().toISOString()
    });
  }

  // POST 요청 프록시 처리
  if (req.method === 'POST') {
    try {
      let apiPath = req.url || '';
      apiPath = apiPath.replace(/^\/api\/proxy/, '');
      const targetUrl = `https://a17574.parkingweb.kr${apiPath}`;
      
      let body = req.body;
      if (!body) {
        body = '';
      } else if (typeof body === 'object' && !(body instanceof Buffer)) {
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: body,
      });

      const responseData = await response.text();
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        res.setHeader('Set-Cookie', setCookie);
      }
      res.status(response.status).send(responseData);
    } catch (error) {
      console.error('❌ 프록시 오류:', error);
      res.status(500).json({ 
        error: 'Proxy Error', 
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
