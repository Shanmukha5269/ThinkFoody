




// const express = require('express');
// const dotenv = require('dotenv');
// const axios = require('axios');
// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const router = express.Router();

// // Load environment variables from .env file
// dotenv.config();

// // Initialize SQLite database
// const db = new sqlite3.Database(path.join(__dirname, '..', 'recipes.db'), (err) => {
//   if (err) {
//     console.error('Error opening database:', err.message);
//   } else {
//     console.log('Connected to SQLite database.');
//   }
// });

// // Ensure the recipes table has the correct schema
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS recipes (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT UNIQUE,
//       ingredients TEXT,
//       totalCalories REAL,
//       servings INTEGER
//     )
//   `);

//   db.all("PRAGMA table_info(recipes)", (err, columns) => {
//     if (err) {
//       console.error('Error checking table schema:', err.message);
//       return;
//     }
//     const columnNames = columns.map(col => col.name);
//     if (!columnNames.includes('totalCalories')) {
//       db.run("ALTER TABLE recipes ADD COLUMN totalCalories REAL", (err) => {
//         if (err) console.error('Error adding totalCalories column:', err.message);
//         else console.log('Added totalCalories column to recipes table.');
//       });
//     }
//     if (!columnNames.includes('servings')) {
//       db.run("ALTER TABLE recipes ADD COLUMN servings INTEGER DEFAULT 4", (err) => {
//         if (err) console.error('Error adding servings column:', err.message);
//         else console.log('Added servings column to recipes table.');
//       });
//     }
//   });
// });

// // Conversion factors to grams (approximate, for non-liquids)
// const conversionFactors = {
//   'cups': 240, 'cup': 240,
//   'tablespoons': 15, 'tablespoon': 15, 'tbsp': 15,
//   'teaspoons': 5, 'teaspoon': 5, 'tsp': 5,
//   'ounces': 28.35, 'ounce': 28.35, 'oz': 28.35,
//   'pounds': 453.59, 'pound': 453.59, 'lb': 453.59,
//   'kilograms': 1000, 'kilogram': 1000, 'kg': 1000,
//   'grams': 1, 'gram': 1, 'g': 1,
//   'milliliters': 1, 'milliliter': 1, 'ml': 1,
//   'liters': 1000, 'liter': 1000, 'l': 1000
// };

// // Approximate calorie factors (per gram for non-liquids, per unit for liquids)
// const calorieFactors = {
//   'flour': 3.64, 'sugar': 3.87, 'cheese': 4.03, 'butter': 7.17, 'chicken': 1.65,
//   'beef': 2.50, 'pork': 2.42, 'rice': 1.30, 'pasta': 1.31, 'bread': 2.65,
//   'salt': 0, 'pepper': 0, 'spices': 0,
//   'oil': { 'tablespoons': 120, 'cups': 1920, 'ml': 8 },
//   'milk': { 'cups': 150, 'ml': 0.63 },
//   'water': { 'cups': 0, 'ml': 0 },
//   'sauce': { 'tablespoons': 20, 'cups': 320 },
//   'honey': { 'tablespoons': 64, 'cups': 1030 },
//   'broth': { 'cups': 10, 'ml': 0.04 },
//   'juice': { 'cups': 112, 'ml': 0.47 },
//   'vinegar': { 'tablespoons': 3, 'cups': 48 }
// };

// // List of liquid items to keep in original units
// const liquidItems = [
//   'oil', 'water', 'sauce', 'milk', 'soy sauce', 'sesame oil', 'broth', 'juice',
//   'vinegar', 'honey', 'syrup', 'cream', 'wine', 'stock', 'beer', 'liquor', 'soda'
// ];

// // Function to calculate calories for an ingredient
// const calculateCalories = (name, quantity, unit) => {
//   const baseName = name.split(' ')[0];
//   const isLiquid = liquidItems.some(liquid => name.includes(liquid));

//   if (isLiquid) {
//     const calData = calorieFactors[baseName] || { [unit]: 0 };
//     const calPerUnit = calData[unit] || 0;
//     return quantity * calPerUnit;
//   } else {
//     const calPerGram = calorieFactors[baseName] || 4;
//     return quantity * calPerGram;
//   }
// };

// // Function to parse Gemini API text response into ingredients
// const parseIngredientsFromText = (text) => {
//   console.log('Raw API text response:', text);
//   const lines = text.split('\n').filter(line => line.trim() && line.includes('*'));
//   const ingredients = [];
//   let totalCalories = 0;
//   const defaultServings = 4;

//   lines.forEach(line => {
//     const match = line.match(/(\d+\.?\d*|\d+\/\d+|\d+\s+\d+\/\d+)\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|kilograms?|kg|grams?|g|milliliters?|ml|liters?|l)\s*([A-Za-z\s]+)/i);
//     if (match) {
//       let [, quantity, unit, name] = match;

//       // Handle fractions and mixed numbers
//       if (quantity.includes('/')) {
//         if (quantity.includes(' ')) {
//           const [whole, fraction] = quantity.split(' ');
//           const [num, denom] = fraction.split('/');
//           quantity = parseInt(whole) + (parseFloat(num) / parseFloat(denom));
//         } else {
//           quantity = eval(quantity);
//         }
//       } else {
//         quantity = parseFloat(quantity);
//       }

//       name = name.trim().toLowerCase().replace(/\(.*\)/, '');
//       unit = unit.toLowerCase();

//       const isLiquid = liquidItems.some(liquid => name.includes(liquid));
//       let ingredient;

//       if (isLiquid) {
//         ingredient = {
//           name: name,
//           quantity: quantity.toFixed(1),
//           unit: unit,
//         };
//       } else {
//         const factor = conversionFactors[unit] || 1;
//         const grams = quantity * factor;
//         ingredient = {
//           name: name,
//           quantity: grams.toFixed(1),
//           unit: 'grams',
//         };
//       }

//       const calories = calculateCalories(name, parseFloat(ingredient.quantity), ingredient.unit);
//       totalCalories += calories;
//       ingredient.calories = calories.toFixed(0);
//       ingredients.push(ingredient);
//     } else {
//       console.warn(`Skipping unparseable line: "${line}"`);
//     }
//   });

//   const caloriesPerServing = (totalCalories / defaultServings).toFixed(1);
//   console.log('Parsed ingredients with calories:', JSON.stringify(ingredients, null, 2));
//   return ingredients.length > 0 ? {
//     ingredients,
//     totalCalories: totalCalories.toFixed(0),
//     servings: defaultServings,
//     caloriesPerServing
//   } : null;
// };

// // Search endpoint
// router.post('/search', async (req, res) => {
//   const { recipeName } = req.body;

//   console.log(`Received search request for recipe: ${recipeName}`);

//   if (!recipeName) {
//     console.log('No recipe name provided');
//     return res.status(400).json({ error: 'Recipe name is required' });
//   }

//   try {
//     console.log(`Fetching fresh data for ${recipeName} from Gemini API`);

//     const prompt = `List the ingredients for a ${recipeName} recipe with quantities and units (e.g., "2 cups of flour", "1 tablespoon of oil").`;
//     const response = await axios.post(
//       'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
//       {
//         contents: [{ parts: [{ text: prompt }] }],
//       },
//       {
//         params: { key: process.env.GEMINI_API_KEY },
//         headers: { 'Content-Type': 'application/json' },
//       }
//     );

//     const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
//     if (!generatedText) {
//       throw new Error('No valid content returned from API');
//     }

//     const result = parseIngredientsFromText(generatedText);
//     if (!result) {
//       throw new Error('Could not parse ingredients from API response');
//     }

//     const { ingredients, totalCalories, servings, caloriesPerServing } = result;
//     const ingredientsJson = JSON.stringify(ingredients);

//     await new Promise((resolve, reject) => {
//       db.run(
//         'INSERT OR REPLACE INTO recipes (name, ingredients, totalCalories, servings) VALUES (?, ?, ?, ?)',
//         [recipeName, ingredientsJson, totalCalories, servings],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     });
//     console.log(`Saved ${recipeName} to database with ingredients and calories:`, { ingredientsJson, totalCalories, servings });

//     res.json({ ingredients, totalCalories, servings, caloriesPerServing });
//   } catch (error) {
//     console.error('Error occurred:', error.message);

//     // Fallback mock data
//     const mockIngredients = [
//       { name: 'flour', quantity: '480.0', unit: 'grams', calories: '1747' },
//       { name: 'cheese', quantity: '240.0', unit: 'grams', calories: '967' },
//       { name: 'oil', quantity: '3.0', unit: 'tablespoons', calories: '360' }
//     ];
//     const mockTotalCalories = mockIngredients.reduce((sum, ing) => sum + parseFloat(ing.calories), 0).toFixed(0);
//     const mockServings = 4;
//     const mockCaloriesPerServing = (mockTotalCalories / mockServings).toFixed(1);

//     await new Promise((resolve, reject) => {
//       db.run(
//         'INSERT OR IGNORE INTO recipes (name, ingredients, totalCalories, servings) VALUES (?, ?, ?, ?)',
//         [recipeName, JSON.stringify(mockIngredients), mockTotalCalories, mockServings],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     }).catch(err => console.error('Mock data save error:', err.message));

//     res.status(200).json({
//       ingredients: mockIngredients,
//       totalCalories: mockTotalCalories,
//       servings: mockServings,
//       caloriesPerServing: mockCaloriesPerServing,
//       note: 'API failed, using mock data'
//     });
//   }
// });

// // Close database on process exit
// process.on('SIGINT', () => {
//   db.close((err) => {
//     if (err) console.error('Error closing database:', err.message);
//     console.log('Database connection closed.');
//     process.exit(0);
//   });
// });

// module.exports = router;



const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

// Load environment variables from .env file
dotenv.config();

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, '..', 'recipes.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Ensure the recipes table has the correct schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      ingredients TEXT,
      totalCalories REAL,
      servings INTEGER
    )
  `);

  db.all("PRAGMA table_info(recipes)", (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err.message);
      return;
    }
    const columnNames = columns.map(col => col.name);
    if (!columnNames.includes('totalCalories')) {
      db.run("ALTER TABLE recipes ADD COLUMN totalCalories REAL", (err) => {
        if (err) console.error('Error adding totalCalories column:', err.message);
        else console.log('Added totalCalories column to recipes table.');
      });
    }
    if (!columnNames.includes('servings')) {
      db.run("ALTER TABLE recipes ADD COLUMN servings INTEGER DEFAULT 4", (err) => {
        if (err) console.error('Error adding servings column:', err.message);
        else console.log('Added servings column to recipes table.');
      });
    }
  });
});

// Conversion factors to grams (approximate, for non-liquids)
const conversionFactors = {
  'cups': 240, 'cup': 240,
  'tablespoons': 15, 'tablespoon': 15, 'tbsp': 15,
  'teaspoons': 5, 'teaspoon': 5, 'tsp': 5,
  'ounces': 28.35, 'ounce': 28.35, 'oz': 28.35,
  'pounds': 453.59, 'pound': 453.59, 'lb': 453.59,
  'kilograms': 1000, 'kilogram': 1000, 'kg': 1000,
  'grams': 1, 'gram': 1, 'g': 1,
  'milliliters': 1, 'milliliter': 1, 'ml': 1,
  'liters': 1000, 'liter': 1000, 'l': 1000
};

// Approximate calorie factors (per gram for non-liquids, per unit for liquids)
const calorieFactors = {
  'flour': 3.64, 'sugar': 3.87, 'cheese': 4.03, 'butter': 7.17, 'chicken': 1.65,
  'beef': 2.50, 'pork': 2.42, 'rice': 1.30, 'pasta': 1.31, 'bread': 2.65,
  'salt': 0, 'pepper': 0, 'spices': 0,
  'oil': { 'tablespoons': 120, 'cups': 1920, 'ml': 8 },
  'milk': { 'cups': 150, 'ml': 0.63 },
  'water': { 'cups': 0, 'ml': 0 },
  'sauce': { 'tablespoons': 20, 'cups': 320 },
  'honey': { 'tablespoons': 64, 'cups': 1030 },
  'broth': { 'cups': 10, 'ml': 0.04 },
  'juice': { 'cups': 112, 'ml': 0.47 },
  'vinegar': { 'tablespoons': 3, 'cups': 48 }
};

// List of liquid items to keep in original units
const liquidItems = [
  'oil', 'water', 'sauce', 'milk', 'soy sauce', 'sesame oil', 'broth', 'juice',
  'vinegar', 'honey', 'syrup', 'cream', 'wine', 'stock', 'beer', 'liquor', 'soda'
];

// Function to calculate calories for an ingredient
const calculateCalories = (name, quantity, unit) => {
  const baseName = name.split(' ')[0];
  const isLiquid = liquidItems.some(liquid => name.includes(liquid));

  if (isLiquid) {
    const calData = calorieFactors[baseName] || { [unit]: 0 };
    const calPerUnit = calData[unit] || 0;
    return quantity * calPerUnit;
  } else {
    const calPerGram = calorieFactors[baseName] || 4;
    return quantity * calPerGram;
  }
};

// Function to parse Gemini API text response into ingredients
const parseIngredientsFromText = (text) => {
  console.log('Raw API text response:', text);
  const lines = text.split('\n').filter(line => line.trim() && line.includes('*'));
  const ingredients = [];
  let totalCalories = 0;
  const defaultServings = 4;

  lines.forEach(line => {
    const match = line.match(/(\d+\.?\d*|\d+\/\d+|\d+\s+\d+\/\d+)\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|kilograms?|kg|grams?|g|milliliters?|ml|liters?|l)?\s*(?:of\s)?(.+)/i);
    if (match) {
      let [, quantity, unit = '', name] = match;

      // Handle fractions and mixed numbers
      if (quantity.includes('/')) {
        if (quantity.includes(' ')) {
          const [whole, fraction] = quantity.split(' ');
          const [num, denom] = fraction.split('/');
          quantity = parseInt(whole) + (parseFloat(num) / parseFloat(denom));
        } else {
          quantity = eval(quantity);
        }
      } else {
        quantity = parseFloat(quantity);
      }

      name = name.trim().toLowerCase().replace(/\(.*\)/, '').replace(/[:*]/g, '').trim();
      unit = unit.toLowerCase();

      if (!name) {
        console.warn(`No name parsed from line: "${line}"`);
        name = 'unknown ingredient';
      }

      const isLiquid = liquidItems.some(liquid => name.includes(liquid));
      let ingredient;

      if (isLiquid && unit) {
        ingredient = { name, quantity: quantity.toFixed(1), unit };
      } else {
        const factor = conversionFactors[unit] || 1;
        const grams = quantity * factor;
        ingredient = { name, quantity: grams.toFixed(1), unit: unit ? 'grams' : '' };
      }

      const calories = calculateCalories(name, parseFloat(ingredient.quantity), ingredient.unit);
      totalCalories += calories;
      ingredient.calories = calories.toFixed(0);
      ingredients.push(ingredient);
    } else {
      console.warn(`Skipping unparseable line: "${line}"`);
    }
  });

  const caloriesPerServing = (totalCalories / defaultServings).toFixed(1);
  console.log('Parsed ingredients with calories:', JSON.stringify(ingredients, null, 2));
  return ingredients.length > 0 ? {
    ingredients,
    totalCalories: totalCalories.toFixed(0),
    servings: defaultServings,
    caloriesPerServing
  } : null;
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
    console.log(`Fetching fresh data for ${recipeName} from Gemini API`);

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

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No valid content returned from API');
    }

    const result = parseIngredientsFromText(generatedText);
    if (!result) {
      throw new Error('Could not parse ingredients from API response');
    }

    const { ingredients, totalCalories, servings, caloriesPerServing } = result;
    const ingredientsJson = JSON.stringify(ingredients);

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO recipes (name, ingredients, totalCalories, servings) VALUES (?, ?, ?, ?)',
        [recipeName, ingredientsJson, totalCalories, servings],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log(`Saved ${recipeName} to database with ingredients and calories:`, { ingredientsJson, totalCalories, servings });

    res.json({ ingredients, totalCalories, servings, caloriesPerServing });
  } catch (error) {
    console.error('Error fetching or parsing Gemini API response:', error.message);

    // Fallback mock data
    const mockIngredients = [
      { name: 'flour', quantity: '480.0', unit: 'grams', calories: '1747' },
      { name: 'cheese', quantity: '240.0', unit: 'grams', calories: '967' },
      { name: 'oil', quantity: '3.0', unit: 'tablespoons', calories: '360' }
    ];
    const mockTotalCalories = mockIngredients.reduce((sum, ing) => sum + parseFloat(ing.calories), 0).toFixed(0);
    const mockServings = 4;
    const mockCaloriesPerServing = (mockTotalCalories / mockServings).toFixed(1);

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO recipes (name, ingredients, totalCalories, servings) VALUES (?, ?, ?, ?)',
        [recipeName, JSON.stringify(mockIngredients), mockTotalCalories, mockServings],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    }).catch(err => console.error('Mock data save error:', err.message));

    console.log(`API failed for "${recipeName}", returning mock data`);
    res.status(200).json({
      ingredients: mockIngredients,
      totalCalories: mockTotalCalories,
      servings: mockServings,
      caloriesPerServing: mockCaloriesPerServing,
      note: 'API failed, using mock data'
    });
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