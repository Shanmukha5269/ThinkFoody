const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(express.json());
 app.use(cors({
   origin: ['https://think-foody.vercel.app', 'http://localhost:3030']
 }));

app.use(cors());

// Static file serving
app.use(express.static(__dirname));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'firstPage.html'));
});

// API Routes
const searchRoute = require('./scripts/backend');
app.use('/api', searchRoute);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

 app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
 });

module.exports = app;
