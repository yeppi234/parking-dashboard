// api/proxy.js
export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. 대상 URL 생성
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;

    // 2. 쿠키 (로그인 요청에는 없을 수 있음)
    const cookieHeader = req.headers.cookie || '';

    // 3. ✅ Body를 정확히 추출 (원본 요청 그대로)
    let body = '';
    if (req.method === 'POST') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        body = req.body.toString('utf-8');
      } else if (typeof req.body === 'object') {
        // ✅ URLSearchParams로 변환 (원본과 동일한 형식)
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          // 배열인 경우 여러 번 추가
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
        body = params.toString();
      }
    }

    console.log('🔑 Target URL:', targetUrl);
    console.log('📦 Body:', body);
    console.log('🍪 Cookie:', cookieHeader);

    // 4. ✅ 원본 요청과 완전히 동일한 헤더로 전달
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        'Referer': 'https://a17574.parkingweb.kr/',
        'Origin': 'https://a17574.parkingweb.kr',
      },
      body: body,
    });

    // 5. ✅ 응답 디버깅
    const data = await response.text();
    console.log('📤 Response Status:', response.status);
    console.log('📤 Response Body (first 200 chars):', data.substring(0, 200));

    // 6. ✅ Set-Cookie 헤더를 클라이언트에 전달
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.status(response.status).send(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      details: error.message,
    });
  }
}
