// GET /api/proxy/kv/parking/all - 모든 주차시간 조회
if (req.method === 'GET' && req.url === '/api/proxy/kv/parking/all') {
  try {
    const data = await kv.get('parkingTimes');
    return res.status(200).json({ data: data || {} });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/proxy/kv/parking/all - 모든 주차시간 저장
if (req.method === 'POST' && req.url === '/api/proxy/kv/parking/all') {
  try {
    const { data } = req.body;
    await kv.set('parkingTimes', JSON.stringify(data), { ex: 86400 });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
