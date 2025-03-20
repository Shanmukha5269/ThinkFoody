

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3030;


app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from root directory
app.use('/styles', express.static(path.join(__dirname, 'styles'))); // Serve styles
app.use('/scripts', express.static(path.join(__dirname, 'scripts'))); // Serve scripts
app.use('/views', express.static(path.join(__dirname, 'views'))); // Serve views

// Serve firstpage.html at root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'firstPage.html'));
  console.log('firstpage.html served');
});

// Serve mainpage.html at /main URL
app.get('/mainPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'mainPage.html'));
  console.log('mainpage.html served');
});

// Serve conerter.html at /main URL
app.get('/converter.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'converter.html'));
  console.log('converter.html served');
});

// Mount the backend router for /search endpoint
const searchRoute = require('./scripts/backend');
app.use('/api', searchRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`First page: http://localhost:${PORT}/`);
  console.log(`Main page: http://localhost:${PORT}/main`);
});