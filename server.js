const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRoutes = require('./backend/routes/products');
const ordersRoutes = require('./backend/routes/orders');
const authRoutes = require('./backend/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);

// Serve static frontend
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// Serve index.html for non-API routes (avoid using a raw '*' route which
// can trigger path-to-regexp errors in some environments)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
