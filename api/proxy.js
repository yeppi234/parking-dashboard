// api/proxy.js
export default async function handler(req, res) {
  // CORS 헤더 (모든 도메인 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  // OPTIONS (프리플라이트) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. 실제 대상 경로 추출 (예: /api/proxy/login → /login)
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    // 2. 쿠키 획득
    const cookieHeader = req.headers.cookie || '';

    // 3. 🔥 요청 본문(body)을 확실히 읽기 (Vercel 환경에서 중요)
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      // Vercel은 req.body를 이미 파싱해놓지만, Buffer나 문자열일 수 있음
      if (req.body) {
        if (typeof req.body === 'string') {
          body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          body = req.body.toString('utf-8');
        } else if (typeof req.body === 'object') {
          // 객체인 경우 URLSearchParams로 변환 (form-data 형식)
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(req.body)) {
            params.append(key, value);
          }
          body = params.toString();
        }
      }
    }

    // 4. 🔥 메서드 강제 POST로 고정 (Vercel이 GET으로 잘못 해석하는 것을 방지)
    const method = 'POST'; // 무조건 POST

    // 5. 대상 서버로 요청 전달
    const response = await fetch(targetUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body || undefined, // body가 없으면 undefined로 설정
    });

    // 6. 응답 반환
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
