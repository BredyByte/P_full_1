const express = require('express');
const app = express();
const port = 5000;

app.get('/api/getKeys', (req, res) => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  const secretKey = process.env.UNSPLASH_SECRET_KEY;

  if (!accessKey || !secretKey) {
    return res.status(400).json({
      error: 'Missing access key or secret key',
      message: 'Ensure both UNSPLASH_ACCESS_KEY and UNSPLASH_SECRET_KEY are set in the environment variables.'
    });
  }

  res.json({
    UNSPLASH_ACCESS_KEY: accessKey,
    UNSPLASH_SECRET_KEY: secretKey
  });

  console.log('The keys have been sent');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
