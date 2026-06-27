import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============================================================
  // ✅ URL 경로 정규화
  // ============================================================
  const url = req.url || '';
  const path = url.replace(/^\/api\/proxy/, '').replace(/^\/api/, '');
  
  console.log('📌 요청 URL:', url);
  console.log('📌 정규화된 경로:', path);

  // ============================================================
  // ✅ KV API
  // ============================================================
  if (req.method === 'GET' && path === '/kv') {
    try {
      const data = await kv.get('completedCars');
      return res.status(200).json({ data: data || [] });
    } catch (error) {
      console.error('KV 조회 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST' && path === '/kv') {
    try {
      const { data } = req.body;
      await kv.set('completedCars', JSON.stringify(data), { ex: 86400 });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('KV 저장 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET' && path === '/kv/parking/all') {
    try {
      const data = await kv.get('parkingTimes');
      return res.status(200).json({ data: data || {} });
    } catch (error) {
      console.error('주차시간 조회 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST' && path === '/kv/parking/all') {
    try {
      const { data } = req.body;
      await kv.set('parkingTimes', JSON.stringify(data), { ex: 86400 });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('주차시간 저장 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ GET /discount/registration - 잔액 조회 (쿠키 유지)
  // ============================================================
  if (req.method === 'GET' && path === '/discount/registration') {
    try {
      const response = await fetch('https://a17574.parkingweb.kr/discount/registration', {
        headers: {
          'Cookie': req.headers.cookie || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      const html = await response.text();
      
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        res.setHeader('Set-Cookie', setCookie);
      }
      
      res.status(response.status).send(html);
    } catch (error) {
      console.error('❌ 잔액 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // ============================================================
  // ✅ POST 요청 - 실제 API 프록시 (쿠키 유지)
  // ============================================================
  if (req.method === 'POST') {
    try {
      const targetUrl = `https://a17574.parkingweb.kr${path}`;
      console.log('🔄 프록시 요청:', targetUrl);
      console.log('📦 쿠키:', req.headers.cookie || '없음');

      // 요청 본문 처리
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

      // 실제 API 호출
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

      // 응답 처리
      const responseData = await response.text();
      
      // 쿠키 전달
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

  // GET 요청 - 상태 확인
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Proxy is running',
      timestamp: new Date().toISOString()
    });
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
