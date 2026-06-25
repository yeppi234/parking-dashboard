export default async function handler(req, res) {
  // ... CORS 헤더, OPTIONS 처리 생략 ...

  if (req.method === 'POST') {
    try {
      // req.body가 없으면 직접 버퍼 읽기
      let body = req.body;
      if (!body) {
        // Vercel에서는 req.body가 자동으로 파싱되지 않을 수 있으므로,
        // req를 스트림으로 읽어야 합니다. 하지만 Next.js API 라우트에서는
        // req.body가 자동으로 파싱됩니다. 사용 중인 프레임워크에 따라 다릅니다.
        // Next.js를 사용한다면 req.body는 이미 파싱된 객체입니다.
        body = new URLSearchParams(req.body).toString();
      }

      const response = await fetch('https://a17574.parkingweb.kr' + req.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': req.headers.cookie || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: body,
      });

      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Proxy error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
