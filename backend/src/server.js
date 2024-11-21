import fetch from 'node-fetch';
import http from 'http';
import https from 'https';
import url from 'url';
import querystring from 'querystring';

const port = 5000;
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const UNSPLASH_AUTH_URL = 'https://unsplash.com/oauth';
const CLIENT_ID = process.env.UNSPLASH_ACCESS_KEY;
const CLIENT_SECRET = process.env.UNSPLASH_SECRET_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI;

const requestHandler = (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/login') {

    const authUrl = `${UNSPLASH_AUTH_URL}/authorize?${querystring.stringify({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'public',
    })}`;


    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  } else if (req.method === 'GET' && parsedUrl.pathname === '/api/callback') {
    const code = parsedUrl.query.code;

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing authorization code' }));
      return;
    }

    const postData = querystring.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code,
      grant_type: 'authorization_code',
    });

    fetch('https://unsplash.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.access_token) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Authentication successful', token: data }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to obtain access token', details: data }));
        }
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error during token exchange', details: err.message }));
      });
  } else if (req.method === 'GET' && parsedUrl.pathname === '/api/search') {
      const query = parsedUrl.query.query;
      const page = parsedUrl.query.page || 1;

      if (!query) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing query parameter' }));
        return;
      }

      const accessKey = CLIENT_ID;

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
