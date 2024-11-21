const http = require('http');
const https = require('https');
const url = require('url');

const port = 5000;
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

const requestHandler = (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/search') {
    const query = parsedUrl.query.query;
    const page = parsedUrl.query.page || 1;

    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query parameter' }));
      return;
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Missing Unsplash access key',
          message: 'Ensure UNSPLASH_ACCESS_KEY is set in the environment variables.',
        })
      );
      return;
    }

    const unsplashUrl = `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=5&client_id=${accessKey}`;

    https.get(unsplashUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => (data += chunk));
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch images', details: err.message }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
};

const server = http.createServer(requestHandler);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
