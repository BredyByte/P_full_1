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



  if (req.method === 'GET' && parsedUrl.pathname === '/api/check-auth') {
    const cookies = parseCookies(req);
    const accessToken = cookies.access_token;

    if (!accessToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not authenticated' }));
      return;
    }

    fetch('https://api.unsplash.com/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to authenticate user');
        }
        return response.json();
      }).then((userData) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(userData));
      }).catch((error) => {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token or user not authenticated' }));
      });
  } else if (req.method === 'GET' && parsedUrl.pathname === '/api/login') {
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
        if (data.access_token && data.refresh_token) {
          const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();

          res.writeHead(302, {
            'Set-Cookie': [
              `access_token=${data.access_token}; Expires=${expires}; HttpOnly; Secure; SameSite=Strict`,
              `refresh_token=${data.refresh_token}; Expires=${expires}; HttpOnly; Secure; SameSite=Strict`,
            ],
            Location: 'http://localhost:8080/',
          });
          res.end();
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to obtain access token', details: data }));
        }
      }).catch((err) => {
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

    const unsplashUrl = `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=5&client_id=${accessKey}`;

    fetch(unsplashUrl)
      .then((apiRes) => {
        if (!apiRes.ok) {
          throw new Error('Failed to fetch images');
        }
        return apiRes.json();
      })
      .then((data) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      })
      .catch((err) => {
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

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  return cookies;
}
