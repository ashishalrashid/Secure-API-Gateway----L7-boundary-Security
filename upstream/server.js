const express = require('express');
const app = express();

app.use(express.json());

app.get('/orders', (req, res) => {
  res.json({ orders: ['order1', 'order2'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'upstream ok' });
});

app.listen(4000, () => {
  console.log('Upstream running on port 4000');
});
