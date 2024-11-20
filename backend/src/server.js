const express = require('express');
const app = express();
const port = 5000;

app.get('/api/hello', (req, res) => {
  console.log('Received request at /api/hello');
  res.json({ response: "hello" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
