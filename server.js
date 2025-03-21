
// const express = require('express');
// const path = require('path');
// const app = express();
// // const cors = require('cors');
// const PORT = process.env.PORT || 3030;


// app.use(express.json());
// app.use(express.static(__dirname)); // Serve static files from root directory
// // app.use('/styles', express.static(path.join(__dirname, 'styles'))); // Serve styles
// // app.use('/scripts', express.static(path.join(__dirname, 'scripts'))); // Serve scripts
// // app.use('/views', express.static(path.join(__dirname, 'views'))); // Serve views

// // app.use(cors({
// //   origin: (origin, callback) => {
// //     const allowedOrigins = ['https://think-foody.vercel.app', 'http://localhost:3030'];
// //     if (!origin || allowedOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   }
// // }));

// // Serve firstpage.html at root URL
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'firstPage.html'));
//   console.log('firstpage.html served');
// });

// // // Serve mainpage.html at /main URL
// // app.get('/mainPage.html', (req, res) => {
// //   res.sendFile(path.join(__dirname, 'views', 'mainPage.html'));
// //   console.log('mainpage.html served');
// // });

// // // Serve conerter.html at /main URL
// // app.get('/converter.html', (req, res) => {
// //   res.sendFile(path.join(__dirname, 'views', 'converter.html'));
// //   console.log('converter.html served');
// // });

// // Mount the backend router for /search endpoint
// const searchRoute = require('./scripts/backend');
// app.use('/api', searchRoute);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });


// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
//   console.log(`First page: http://localhost:${PORT}/`);
//   console.log(`Main page: http://localhost:${PORT}/main`);
// });




// the new code

const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(express.json());
// app.use(cors({
//   origin: ['https://think-foody.vercel.app', 'http://localhost:3030']
// }));

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

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

module.exports = app;