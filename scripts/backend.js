// const express = require('express');
// const dotenv = require('dotenv');
// const axios = require('axios');
// const sqlite3 = require('sqlite3').verbose();
// const router = express.Router();

// // Load environment variables from .env file
// dotenv.config();

// // Initialize SQLite database
// const db = new sqlite3.Database('./recipes.db', (err) => {
//   if (err) {
//     console.error('Error opening database:', err.message);
//   } else {
//     console.log('Connected to SQLite database.');
//   }
// });

// // Create recipes table if it doesn't exist
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS recipes (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT UNIQUE,
//       ingredients TEXT
//     )
//   `);
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
// // Function to parse Gemini API text response into ingredients
// const parseIngredientsFromText = (text) => {
//   console.log('Raw API text response:', text);
//   const lines = text.split('\n').filter(line => line.trim() && line.includes('*')); // Assuming ingredients are bullet points
//   const ingredients = [];

//   lines.forEach((line) => {
//     // Enhanced regex to capture quantity, unit, and name
//     const match = line.match(/(\d+\.?\d*|\d+\/\d+|\d+)\s*(cups?|tablespoons?|teaspoons?|ounces?|milliliters?|ml|pounds?|grams?)\s*([A-Za-z\s]+)/i);
//     let name, quantity, unit;

//     if (match) {
//       // Case 1: Quantity and unit are provided
//       [, quantity, unit, name] = match;
//       // Handle fractions like "1/2"
//       quantity = quantity.includes('/') ? eval(quantity) : parseFloat(quantity);
//       name = name.trim().toLowerCase().replace(/\(.*\)/, ''); // Clean up name
//       unit = unit.toLowerCase();

//       // Convert to grams
//       const factor = conversionFactors[unit] || 1; // Default to 1 if unit unrecognized
//       const grams = quantity * factor;

//       // Round appropriately: whole numbers for >10g, 1 decimal for smaller amounts
//       const roundedGrams = grams >= 10 ? Math.round(grams) : grams.toFixed(1);

//       ingredients.push({
//         name: name,
//         quantity: roundedGrams.toString(),
//         unit: 'grams',
//       });
//     } else {
//       // Case 2: No clear quantity/unit, check for approximate measurements
//       const approxMatch = line.match(/(pinch|dash|handful|sprig)\s*(?:of\s*)?([A-Za-z\s]+)/i);
//       if (approxMatch) {
//         const [, approxUnit, approxName] = approxMatch;
//         name = approxName.trim().toLowerCase();
//         const grams = approximateQuantities[approxUnit.toLowerCase()] || 0.5; // Default to 0.5g if unrecognized

//         ingredients.push({
//           name: name,
//           quantity: grams.toFixed(1),
//           unit: 'grams',
//         });
//       } else {
//         // Case 3: Fallback for completely unparseable lines
//         const fallbackMatch = line.match(/\*\s*(.+)/);
//         if (fallbackMatch) {
//           name = fallbackMatch[1].trim().toLowerCase();
//           ingredients.push({
//             name: name,
//             quantity: '1.0', // Default to 1 gram for unknown quantities
//             unit: 'grams',
//             note: 'Approximated quantity due to unclear input',
//           });
//         } else {
//           console.warn(`Line not parsed: "${line}"`);
//         }
//       }
//     }
//   });

//   console.log('Parsed ingredients:', JSON.stringify(ingredients, null, 2));
//   return ingredients.length > 0 ? ingredients : null;
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
//     // Check if recipe exists in the database
//     const row = await new Promise((resolve, reject) => {
//       db.get('SELECT ingredients FROM recipes WHERE name = ?', [recipeName], (err, row) => {
//         if (err) reject(err);
//         else resolve(row);
//       });
//     });

//     if (row) {
//       console.log(`Found ${recipeName} in database`);
//       const ingredients = JSON.parse(row.ingredients);
//       console.log('Returning database ingredients:', JSON.stringify(ingredients, null, 2));
//       return res.json({ ingredients });
//     }

//     console.log(`${recipeName} not in database, fetching from Gemini API`);

//     // Prepare prompt for Gemini API
//     const prompt = `List the ingredients for a ${recipeName} recipe with quantities and units (e.g., "2 cups of flour", "1 tablespoon of oil"). Use bullet points with '*' for each ingredient.`;
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

//     console.log('API call successful, response status:', response.status);
//     const data = response.data;
//     console.log('Full API response:', JSON.stringify(data, null, 2));

//     const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
//     if (!generatedText) {
//       throw new Error('No valid content returned from API');
//     }

//     const ingredients = parseIngredientsFromText(generatedText);
//     if (!ingredients) {
//       throw new Error('Could not parse ingredients from API response');
//     }

//     // Save to database
//     const ingredientsJson = JSON.stringify(ingredients);
//     await new Promise((resolve, reject) => {
//       db.run(
//         'INSERT INTO recipes (name, ingredients) VALUES (?, ?)',
//         [recipeName, ingredientsJson],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     });
//     console.log(`Saved ${recipeName} to database with ingredients: ${ingredientsJson}`);

//     res.json({ ingredients });
//   } catch (error) {
//     console.error('Error occurred:', error.message);
//     if (error.response) {
//       console.error('API status:', error.response.status);
//       console.error('API error data:', JSON.stringify(error.response.data, null, 2));
//     }

//     // Fallback mock data
//     const mockIngredients = [
//       { name: 'flour', quantity: '480', unit: 'grams' },
//       { name: 'cheese', quantity: '240', unit: 'grams' },
//       { name: 'oil', quantity: '45', unit: 'grams' }, // 3 tbsp converted
//     ];
//     console.log('Falling back to mock data due to error');

//     const mockJson = JSON.stringify(mockIngredients);
//     await new Promise((resolve, reject) => {
//       db.run(
//         'INSERT OR IGNORE INTO recipes (name, ingredients) VALUES (?, ?)',
//         [recipeName, mockJson],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     }).catch((err) => console.error('Mock data save error:', err.message));

//     res.status(200).json({ ingredients: mockIngredients, note: 'API failed, using mock data' });
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






// const express = require('express');
// const dotenv = require('dotenv');
// const axios = require('axios');
// const sqlite3 = require('sqlite3').verbose();
// const router = express.Router();
// const cors = require('cors');


// // Load environment variables from .env file
// dotenv.config();

// // Initialize SQLite database
// const db = new sqlite3.Database('./recipes.db', (err) => {
//   if (err) {
//     console.error('Error opening database:', err.message);
//   } else {
//     console.log('Connected to SQLite database.');
//   }
// });

// // Create recipes table if it doesn't exist
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS recipes (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT UNIQUE,
//       ingredients TEXT
//     )
//   `);
// });

// // Conversion factors (accurate averages for common ingredients)
// const conversionFactors = {
//   // Dry ingredients volume to grams
//   'cups': 125, 'cup': 125,           // All-purpose flour: 1 cup ≈ 125g
//   'tablespoons': 7.5, 'tablespoon': 7.5, 'tbsp': 7.5,  // Flour: 1 tbsp ≈ 7.5g
//   'teaspoons': 2.5, 'teaspoon': 2.5, 'tsp': 2.5,       // Flour: 1 tsp ≈ 2.5g
  
//   // Weight units
//   'ounces': 28.35, 'ounce': 28.35, 'oz': 28.35,
//   'pounds': 453.59, 'pound': 453.59, 'lb': 453.59,
//   'kilograms': 1000, 'kilogram': 1000, 'kg': 1000,
//   'grams': 1, 'gram': 1, 'g': 1,
  
//   // Liquid volume units (convert to ml but keep separate)
//   'milliliters': 1, 'milliliter': 1, 'ml': 1,
//   'liters': 1000, 'liter': 1000, 'l': 1000
// };

// // Calorie factors (kcal per gram)
// const calorieFactors = {
//   'flour': 3.64, 'sugar': 3.87, 'cheese': 4.03, 
//   'butter': 7.17, 'chicken': 1.65, 'beef': 2.50,
//   'pork': 2.42, 'rice': 1.30, 'pasta': 1.31,
//   'bread': 2.65, 'oil': 8.8, 'milk': 0.64,
//   'honey': 3.0, 'syrup': 2.7
// };

// // Liquid items to preserve original units
// const liquidItems = [
//   'oil', 'water', 'sauce', 'milk', 'broth', 'juice',
//   'vinegar', 'honey', 'syrup', 'cream', 'stock', 'soda',
//   'soy sauce', 'fish sauce', 'liquid smoke', 'extract'
// ];

// // Improved ingredient parser
// const parseIngredientsFromText = (text) => {
//   console.log('Raw API text response:', text);
//   const ingredients = [];
//   const lines = text.split('\n').filter(line => line.trim() && line.includes('*'));

//   lines.forEach((line) => {
//     const match = line.match(/(\d+\.?\d*|\d+\/\d+|\d+)\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|ounces?|oz|pounds?|lb|grams?|g|kg|kilograms?|milliliters?|ml|liters?|l)\s+([\w\s]+)/i);
    
//     if (match) {
//       let [, quantity, unit, name] = match;
//       quantity = quantity.includes('/') ? eval(quantity) : parseFloat(quantity);
//       name = name.trim().toLowerCase().replace(/\(.*?\)/g, '');
//       unit = unit.toLowerCase();

//       // Check if ingredient is liquid
//       const isLiquid = liquidItems.some(liquid => name.includes(liquid));

//       if (isLiquid) {
//         // Convert to milliliters but keep original unit
//         const convertedQty = unit === 'cups' ? quantity * 240 : 
//                             unit === 'tablespoons' ? quantity * 15 :
//                             unit === 'teaspoons' ? quantity * 5 :
//                             quantity;
        
//         ingredients.push({
//           name: name,
//           quantity: convertedQty.toFixed(1),
//           unit: 'ml',
//           originalUnit: unit,
//           isLiquid: true
//         });
//       } else {
//         // Convert to grams for dry ingredients
//         const grams = quantity * (conversionFactors[unit] || 1);
//         const roundedGrams = grams >= 10 ? Math.round(grams) : grams.toFixed(1);

//         ingredients.push({
//           name: name,
//           quantity: roundedGrams.toString(),
//           unit: 'grams',
//           isLiquid: false
//         });
//       }
//     } else {
//       // Handle approximate measurements
//       const approxMatch = line.match(/(pinch|dash|handful|sprig)\s+(?:of\s+)?([\w\s]+)/i);
//       if (approxMatch) {
//         const [, approxUnit, approxName] = approxMatch;
//         ingredients.push({
//           name: approxName.trim().toLowerCase(),
//           quantity: approxUnit === 'handful' ? '50' : '0.5',
//           unit: 'grams',
//           note: `Approximate ${approxUnit} measurement`
//         });
//       }
//     }
//   });

//   return ingredients.length > 0 ? ingredients : null;
// };

// // Search endpoint
// router.post('/search', async (req, res) => {
//   const { recipeName } = req.body;

//   if (!recipeName) {
//     return res.status(400).json({ error: 'Recipe name is required' });
//   }

//   try {
//     // Database lookup
//     const row = await new Promise((resolve, reject) => {
//       db.get('SELECT ingredients FROM recipes WHERE name = ?', [recipeName], (err, row) => {
//         err ? reject(err) : resolve(row);
//       });
//     });

//     if (row) {
//       return res.json({ ingredients: JSON.parse(row.ingredients) });
//     }

//     // Gemini API call
//     const prompt = `Provide ingredients for ${recipeName} with exact quantities and units in bullet points (*)`;
//     const response = await axios.post(
//       'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
//       { contents: [{ parts: [{ text: prompt }] }] },
//       { params: { key: process.env.GEMINI_API_KEY }, headers: { 'Content-Type': 'application/json' } }
//     );

//     const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
//     if (!generatedText) throw new Error('Invalid API response');

//     const ingredients = parseIngredientsFromText(generatedText) || [];
    
//     // Calculate calories
//     ingredients.forEach(ing => {
//       if (!ing.isLiquid && calorieFactors[ing.name.split(' ')[0]]) {
//         ing.calories = Math.round(ing.quantity * calorieFactors[ing.name.split(' ')[0]]);
//       }
//     });

//     // Save to database with conflict handling
//     await new Promise((resolve, reject) => {
//       db.run(
//         'INSERT OR IGNORE INTO recipes (name, ingredients) VALUES (?, ?)',
//         [recipeName, JSON.stringify(ingredients)],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     });

//     res.json({ ingredients });
//   } catch (error) {
//     console.error('Error:', error.message);
//     // Fallback mock data
//     const mockIngredients = [
//       { name: 'flour', quantity: '250', unit: 'grams', calories: 910 },
//       { name: 'milk', quantity: '240', unit: 'ml', isLiquid: true, calories: 154 },
//       { name: 'butter', quantity: '113', unit: 'grams', calories: 810 }
//     ];
    
//     try {
//       // Attempt to save mock data with conflict handling
//       await new Promise((resolve, reject) => {
//         db.run(
//           'INSERT OR IGNORE INTO recipes (name, ingredients) VALUES (?, ?)',
//           [recipeName, JSON.stringify(mockIngredients)],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     } catch (dbError) {
//       console.error('Database fallback error:', dbError.message);
//     }

//     res.status(200).json({ ingredients: mockIngredients, note: 'Using mock data' });
//   }
// });

// // Database cleanup on exit
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
    const match = line.match(/(\d+\.?\d*|\d+\/\d+|\d+\s+\d+\/\d+)\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|kilograms?|kg|grams?|g|milliliters?|ml|liters?|l)\s*([A-Za-z\s]+)/i);
    if (match) {
      let [, quantity, unit, name] = match;

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

      name = name.trim().toLowerCase().replace(/\(.*\)/, '');
      unit = unit.toLowerCase();

      const isLiquid = liquidItems.some(liquid => name.includes(liquid));
      let ingredient;

      if (isLiquid) {
        ingredient = {
          name: name,
          quantity: quantity.toFixed(1),
          unit: unit,
        };
      } else {
        const factor = conversionFactors[unit] || 1;
        const grams = quantity * factor;
        ingredient = {
          name: name,
          quantity: grams.toFixed(1),
          unit: 'grams',
        };
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
    console.error('Error occurred:', error.message);

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