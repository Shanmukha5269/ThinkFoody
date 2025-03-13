const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded bodies (required for backend POST requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'firstPage.html'));
  console.log('firstPage.html served');
});

app.get('/mainPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'mainPage.html'));
  console.log('mainPage.html served');
});

// Mount the backend router
const searchRoute = require('./scripts/backend');
app.use('/api', searchRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT} to view the food recipe website`);
});