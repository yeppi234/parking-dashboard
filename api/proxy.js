export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS 요청 처리 (프리플라이트)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청 처리 (상태 확인용)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Proxy is running',
      timestamp: new Date().toISOString()
    });
  }

  // POST 요청만 프록시 처리
  if (req.method === 'POST') {
    try {
      // 🔥 중요: /api/proxy 제거하고 실제 API 경로로 변환
      let apiPath = req.url || '';
      // /api/proxy/login → /login
      // /api/proxy/state/doListMst → /state/doListMst
      // /api/proxy/discount/registration/getForDiscount → /discount/registration/getForDiscount
      apiPath = apiPath.replace(/^\/api\/proxy/, '');
      
      const targetUrl = `https://a17574.parkingweb.kr${apiPath}`;
      console.log('🔄 프록시 요청:', targetUrl);
      console.log('📦 요청 본문:', req.body);

      // 🔥 요청 본문 처리 (Vercel 서버리스 함수에서 body 읽기)
      let body = req.body;
      
      // body가 없거나 객체가 아닌 경우 처리
      if (!body) {
        body = '';
      } else if (typeof body === 'object' && !(body instanceof Buffer)) {
        // 객체를 URLSearchParams로 변환 (form-data)
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
          params.append(key, value);
        }
        body = params.toString();
      }

      // 🔥 실제 API 호출
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

      // 🔥 응답 처리
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
