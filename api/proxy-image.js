
const fetch = require('node-fetch');

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await fetch(decodeURIComponent(url));
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    const buffer = await response.buffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Important for Canvas
    res.send(buffer);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}
