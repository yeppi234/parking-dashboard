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
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST' && path === '/kv') {
    try {
      const { data } = req.body;
      await kv.set('completedCars', JSON.stringify(data), { ex: 86400 });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET' && path === '/kv/parking/all') {
    try {
      const data = await kv.get('parkingTimes');
      return res.status(200).json({ data: data || {} });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST' && path === '/kv/parking/all') {
    try {
      const { data } = req.body;
      await kv.set('parkingTimes', JSON.stringify(data), { ex: 86400 });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ GET /discount/registration - 잔액 조회
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
      if (setCookie) res.setHeader('Set-Cookie', setCookie);
      return res.status(response.status).send(html);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ 메모 API (Vercel KV)
  // ============================================================

  // 메모 조회 (GET)
  if (req.method === 'GET' && path === '/memo') {
    try {
      const carNo = url.split('?').find(q => q.includes('carNo='))?.split('=')[1] || '';
      if (!carNo) {
        return res.status(400).json({ error: 'carNo 파라미터가 필요합니다.' });
      }
      const data = await kv.get(`memo:${carNo}`);
      return res.status(200).json({ data: data || null });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 메모 저장 (POST)
  if (req.method === 'POST' && path === '/memo') {
    try {
      const { carNo, memo } = req.body;
      if (!carNo || !memo) {
        return res.status(400).json({ error: 'carNo와 memo가 필요합니다.' });
      }
      const memoData = {
        memo: memo.trim(),
        updatedAt: new Date().toISOString()
      };
      await kv.set(`memo:${carNo}`, JSON.stringify(memoData));
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 메모 삭제 (DELETE)
  if (req.method === 'DELETE' && path === '/memo') {
    try {
      const carNo = url.split('?').find(q => q.includes('carNo='))?.split('=')[1] || '';
      if (!carNo) {
        return res.status(400).json({ error: 'carNo 파라미터가 필요합니다.' });
      }
      await kv.del(`memo:${carNo}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ============================================================
  // ✅ POST 요청 - 실제 API 프록시
  // ============================================================
  if (req.method === 'POST') {
    try {
      const targetUrl = `https://a17574.parkingweb.kr${path}`;
      console.log('🔄 프록시 요청:', targetUrl);
      console.log('📦 쿠키:', req.headers.cookie || '없음');

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

      return res.status(response.status).send(responseData);
    } catch (error) {
      console.error('❌ 프록시 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // 지원하지 않는 메서드
  return res.status(405).json({ error: 'Method Not Allowed' });
}
