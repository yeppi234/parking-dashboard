import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS 요청 처리 (프리플라이트)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============================================================
  // ✅ KV API: 출차 완료 차량 목록 조회
  // ============================================================
  if (req.method === 'GET' && req.url === '/api/proxy/kv') {
    try {
      const data = await kv.get('completedCars');
      return res.status(200).json({ data: data || [] });
    } catch (error) {
      console.error('KV 조회 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ KV API: 출차 완료 차량 목록 저장
  // ============================================================
  if (req.method === 'POST' && req.url === '/api/proxy/kv') {
    try {
      const { data } = req.body;
      await kv.set('completedCars', JSON.stringify(data), { ex: 86400 });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('KV 저장 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ KV API: 모든 차량 주차시간 조회
  // ============================================================
  if (req.method === 'GET' && req.url === '/api/proxy/kv/parking/all') {
    try {
      const data = await kv.get('parkingTimes');
      return res.status(200).json({ data: data || {} });
    } catch (error) {
      console.error('주차시간 조회 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ KV API: 모든 차량 주차시간 저장
  // ============================================================
  if (req.method === 'POST' && req.url === '/api/proxy/kv/parking/all') {
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
  // ✅ GET 요청: 프록시 상태 확인
  // ============================================================
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Proxy is running',
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================
  // ✅ POST 요청: 실제 API 프록시
  // ============================================================
  if (req.method === 'POST') {
    try {
      // /api/proxy 제거하고 실제 API 경로로 변환
      let apiPath = req.url || '';
      apiPath = apiPath.replace(/^\/api\/proxy/, '');
      
      const targetUrl = `https://a17574.parkingweb.kr${apiPath}`;
      console.log('🔄 프록시 요청:', targetUrl);
      console.log('📦 요청 본문:', req.body);

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

  // 지원하지 않는 메서드
  res.status(405).json({ error: 'Method Not Allowed' });
}
