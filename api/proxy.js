// ============================================================
// ✅ 삭제 API - 할인내역 삭제 (state/delete)
// ============================================================
if (req.method === 'POST' && path === '/state/delete') {
  try {
    const targetUrl = `https://a17574.parkingweb.kr/state/delete`;
    console.log('🔄 삭제 요청:', targetUrl);
    console.log('📦 요청 본문:', req.body);

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

    console.log('📌 삭제 응답 상태:', response.status);
    res.status(response.status).send(responseData);
  } catch (error) {
    console.error('❌ 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
  return;
}
