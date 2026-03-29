export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-endpoint, x-action');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.headers['x-action'] || '';

  // TOKEN GENERATION endpoint
  if (action === 'token') {
    try {
      const { code, client_id, client_secret, redirect_uri } = req.body || {};
      if (!code || !client_id || !client_secret) {
        return res.status(400).json({ error: 'Missing: code, client_id or client_secret' });
      }
      const params = new URLSearchParams({
        code, client_id, client_secret,
        redirect_uri: redirect_uri || 'http://localhost',
        grant_type: 'authorization_code'
      });
      const r = await fetch('https://api.upstox.com/v2/login/authorization/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: params.toString()
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Token generation failed', message: e.message });
    }
  }

  // REGULAR UPSTOX API PROXY
  try {
    const endpoint = req.headers['x-endpoint'] || '';
    const auth = req.headers['authorization'] || '';
    if (!endpoint) return res.status(400).json({ error: 'Missing x-endpoint header' });
    if (!auth) return res.status(400).json({ error: 'Missing Authorization header' });
    const url = 'https://api.upstox.com/v2' + decodeURIComponent(endpoint);
    const r = await fetch(url, {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: { 'Authorization': auth, 'Api-Version': '2.0', 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error', message: e.message });
  }
}
