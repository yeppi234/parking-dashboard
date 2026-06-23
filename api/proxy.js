// api/proxy.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const targetPath = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://a17574.parkingweb.kr${targetPath}`;
    const cookieHeader = req.headers.cookie || '';

    let body = req.body;
    if (req.method === 'POST') {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
        body = params.toString();
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: req.method === 'POST' ? body : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
