const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Load environment variables from .env file
dotenv.config();

// Initialize SQLite database
const db = new sqlite3.Database('./recipes.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create recipes table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      ingredients TEXT
    )
  `);
});

// Conversion factors for non-liquid items to grams (approximate)
const conversionFactors = {
  cups: 240,
  tablespoons: 15,
  teaspoons: 5,
  ounces: 28.35,
};

// List of liquid items to keep in original units
const liquidItems = [
  'oil', 'water', 'sauce', 'milk', 'soy sauce', 'sesame oil', 'broth', 'juice', 'vinegar', 'honey', 'syrup'
];

// Function to parse Gemini API text response into ingredients
const parseIngredientsFromText = (text) => {
  console.log('Raw API text response:', text);
  const lines = text.split('\n').filter(line => line.trim() && line.includes('*'));
  const ingredients = [];

  lines.forEach(line => {
    const match = line.match(/(\d+\.?\d*|\d+\/\d+)\s*(cups?|tablespoons?|teaspoons?|ounces?|milliliters?|ml)\s*([A-Za-z\s]+)/i);
    if (match) {
      let [, quantity, unit, name] = match;
      quantity = quantity.includes('/') ? eval(quantity) : parseFloat(quantity);
      name = name.trim().toLowerCase().replace(/\(.*\)/, '');
      unit = unit.toLowerCase();

      const isLiquid = liquidItems.some(liquid => name.includes(liquid));
      
      if (isLiquid) {
        ingredients.push({
          name: name,
          quantity: quantity.toFixed(1),
          unit: unit,
        });
      } else {
        const factor = conversionFactors[unit] || 1;
        const grams = quantity * factor;
        ingredients.push({
          name: name,
          quantity: grams.toFixed(1),
          unit: 'grams',
        });
      }
    }
  });

  console.log('Parsed ingredients:', JSON.stringify(ingredients, null, 2));
  return ingredients.length > 0 ? ingredients : null;
};

// Search endpoint (moved to router)
router.post('/search', async (req, res) => {
  const { recipeName } = req.body;

  console.log(`Received search request for recipe: ${recipeName}`);

  if (!recipeName) {
    console.log('No recipe name provided');
    return res.status(400).json({ error: 'Recipe name is required' });
  }

  try {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT ingredients FROM recipes WHERE name = ?', [recipeName], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (row) {
      console.log(`Found ${recipeName} in database`);
      const ingredients = JSON.parse(row.ingredients);
      console.log('Returning database ingredients:', JSON.stringify(ingredients, null, 2));
      return res.json({ ingredients });
    }

    console.log(`${recipeName} not in database, fetching from Gemini API`);

    const prompt = `List the ingredients for a ${recipeName} recipe with quantities and units (e.g., "2 cups of flour", "1 tablespoon of oil").`;
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    console.log('API call successful, response status:', response.status);
    const data = response.data;
    console.log('Full API response:', JSON.stringify(data, null, 2));

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No valid content returned from API');
    }

    const ingredients = parseIngredientsFromText(generatedText);
    if (!ingredients) {
      throw new Error('Could not parse ingredients from API response');
    }

    const ingredientsJson = JSON.stringify(ingredients);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO recipes (name, ingredients) VALUES (?, ?)',
        [recipeName, ingredientsJson],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log(`Saved ${recipeName} to database with ingredients: ${ingredientsJson}`);

    res.json({ ingredients });
  } catch (error) {
    console.error('Error occurred:', error.message);
    if (error.response) {
      console.error('API status:', error.response.status);
      console.error('API error data:', JSON.stringify(error.response.data, null, 2));
    }

    const mockIngredients = [
      { name: 'flour', quantity: '480.0', unit: 'grams' },
      { name: 'cheese', quantity: '240.0', unit: 'grams' },
      { name: 'oil', quantity: '3.0', unit: 'tablespoons' },
    ];
    console.log('Falling back to mock data due to error');

    const mockJson = JSON.stringify(mockIngredients);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO recipes (name, ingredients) VALUES (?, ?)',
        [recipeName, mockJson],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    }).catch((err) => console.error('Mock data save error:', err.message));

    res.status(200).json({ ingredients: mockIngredients, note: 'API failed, using mock data' });
  }
});

// Other router endpoints
router.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required', results: [] });
  }
  const results = searchRecipes(query);
  console.log(`Searching for "${query}" - Found ${results.length} results`);
  res.json({ success: true, query, count: results.length, results });
});

router.get('/recipes', (req, res) => {
  res.json({ success: true, count: sampleRecipes.length, results: sampleRecipes });
});

router.get('/recipes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = sampleRecipes.find(r => r.id === id);
  if (!recipe) {
    return res.status(404).json({ success: false, message: 'Recipe not found' });
  }
  res.json({ success: true, recipe });
});

// Error handling middleware (optional, can be moved to server.js if preferred)
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Close database on process exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err.message);
    console.log('Database connection closed.');
    process.exit(0);
  });
});

module.exports = router;