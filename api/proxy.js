// api/proxy.js
export default async function handler(req, res) {
  // ✅ 1. CORS 헤더 (모든 도메인에서 접근 가능)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // ✅ 2. OPTIONS (프리플라이트) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ✅ 3. 대상 URL 생성
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;
    console.log('🔑 Target URL:', targetUrl); // Vercel 로그 확인용

    // ✅ 4. 쿠키 획득
    const cookieHeader = req.headers.cookie || '';

    // ✅ 5. 요청 본문(body)을 확실히 읽기 (가장 중요!)
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (req.body) {
        if (typeof req.body === 'string') {
          body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          body = req.body.toString('utf-8');
        } else if (typeof req.body === 'object') {
          // 객체 → URLSearchParams로 변환
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(req.body)) {
            params.append(key, value);
          }
          body = params.toString();
        }
      }
      console.log('📦 Body:', body); // Vercel 로그 확인용
    }

    // ✅ 6. 요청 메서드 강제 POST (Vercel이 GET으로 잘못 해석하는 것을 방지)
    const method = 'POST';

    // ✅ 7. 대상 서버로 요청 전달
    const response = await fetch(targetUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      },
      body: body || undefined, // body가 없으면 undefined
    });

    // ✅ 8. 응답 반환
    const data = await response.text();
    console.log('📤 Response status:', response.status); // Vercel 로그 확인용
    res.status(response.status).send(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      details: error.message,
      stack: error.stack,
    });
  }
}
