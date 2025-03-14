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

// Conversion factors to grams (approximate)
const conversionFactors = {
  cups: 240,        // General approximation; can be refined per ingredient
  tablespoons: 15,
  teaspoons: 5,
  ounces: 28.35,
  milliliters: 1,   // Assuming density ~1g/mL (water-like)
  ml: 1,
  pounds: 453.59,
  grams: 1,         // No conversion needed
};

// Approximate quantities for ambiguous measurements (in grams)
const approximateQuantities = {
  pinch: 0.5,       // Common for spices
  dash: 0.3,        // Common for spices or liquids
  handful: 30,      // Rough estimate for herbs or small items
  sprig: 2,         // Common for herbs like thyme or rosemary
};

// Function to parse Gemini API text response into ingredients
const parseIngredientsFromText = (text) => {
  console.log('Raw API text response:', text);
  const lines = text.split('\n').filter(line => line.trim() && line.includes('*')); // Assuming ingredients are bullet points
  const ingredients = [];

  lines.forEach((line) => {
    // Enhanced regex to capture quantity, unit, and name
    const match = line.match(/(\d+\.?\d*|\d+\/\d+|\d+)\s*(cups?|tablespoons?|teaspoons?|ounces?|milliliters?|ml|pounds?|grams?)\s*([A-Za-z\s]+)/i);
    let name, quantity, unit;

    if (match) {
      // Case 1: Quantity and unit are provided
      [, quantity, unit, name] = match;
      // Handle fractions like "1/2"
      quantity = quantity.includes('/') ? eval(quantity) : parseFloat(quantity);
      name = name.trim().toLowerCase().replace(/\(.*\)/, ''); // Clean up name
      unit = unit.toLowerCase();

      // Convert to grams
      const factor = conversionFactors[unit] || 1; // Default to 1 if unit unrecognized
      const grams = quantity * factor;

      // Round appropriately: whole numbers for >10g, 1 decimal for smaller amounts
      const roundedGrams = grams >= 10 ? Math.round(grams) : grams.toFixed(1);

      ingredients.push({
        name: name,
        quantity: roundedGrams.toString(),
        unit: 'grams',
      });
    } else {
      // Case 2: No clear quantity/unit, check for approximate measurements
      const approxMatch = line.match(/(pinch|dash|handful|sprig)\s*(?:of\s*)?([A-Za-z\s]+)/i);
      if (approxMatch) {
        const [, approxUnit, approxName] = approxMatch;
        name = approxName.trim().toLowerCase();
        const grams = approximateQuantities[approxUnit.toLowerCase()] || 0.5; // Default to 0.5g if unrecognized

        ingredients.push({
          name: name,
          quantity: grams.toFixed(1),
          unit: 'grams',
        });
      } else {
        // Case 3: Fallback for completely unparseable lines
        const fallbackMatch = line.match(/\*\s*(.+)/);
        if (fallbackMatch) {
          name = fallbackMatch[1].trim().toLowerCase();
          ingredients.push({
            name: name,
            quantity: '1.0', // Default to 1 gram for unknown quantities
            unit: 'grams',
            note: 'Approximated quantity due to unclear input',
          });
        } else {
          console.warn(`Line not parsed: "${line}"`);
        }
      }
    }
  });

  console.log('Parsed ingredients:', JSON.stringify(ingredients, null, 2));
  return ingredients.length > 0 ? ingredients : null;
};

// Search endpoint
router.post('/search', async (req, res) => {
  const { recipeName } = req.body;

  console.log(`Received search request for recipe: ${recipeName}`);

  if (!recipeName) {
    console.log('No recipe name provided');
    return res.status(400).json({ error: 'Recipe name is required' });
  }

  try {
    // Check if recipe exists in the database
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

    // Prepare prompt for Gemini API
    const prompt = `List the ingredients for a ${recipeName} recipe with quantities and units (e.g., "2 cups of flour", "1 tablespoon of oil"). Use bullet points with '*' for each ingredient.`;
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

    // Save to database
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

    // Fallback mock data
    const mockIngredients = [
      { name: 'flour', quantity: '480', unit: 'grams' },
      { name: 'cheese', quantity: '240', unit: 'grams' },
      { name: 'oil', quantity: '45', unit: 'grams' }, // 3 tbsp converted
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

// Close database on process exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err.message);
    console.log('Database connection closed.');
    process.exit(0);
  });
});

module.exports = router;
