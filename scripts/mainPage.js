// Main Page JavaScript

// Function to navigate to mainPage.html
function navigateToMainPage() {
    window.location.href = '/mainPage.html';
}

// Search recommendations functionality
const searchInput = document.getElementById('search-input');
const recommendationButtons = document.querySelectorAll('.recommendation-btn');

if (recommendationButtons.length > 0) {
    recommendationButtons.forEach(button => {
        button.addEventListener('click', function() {
            const recommendation = this.textContent.trim();
            if (searchInput) {
                searchInput.value = recommendation;
                searchRecipe();
            }
        });
    });
}

// Handle Enter key in search input
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchRecipe();
        }
    });
}

// Kitchen counter functionality
const kitchenBtn = document.querySelector('.kitchen-btn');
const kitchenCount = document.querySelector('.kitchen-count');
let count = 0;

function addToKitchen() {
    count++;
    kitchenCount.textContent = count;
    kitchenCount.classList.add('kitchen-count-animate');
    setTimeout(() => {
        kitchenCount.classList.remove('kitchen-count-animate');
    }, 300);
}

// Search functionality
const searchButton = document.querySelector('.search-button');
if (searchButton) {
    searchButton.addEventListener('click', searchRecipe);
}

/**
 * Search for recipes using the API
 */
function searchRecipe() {
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput ? searchInput.value.trim() : '';
    const resultsContainer = document.getElementById('search-results');

    if (!searchValue) {
        alert('Please enter a search term');
        return;
    }

    if (!resultsContainer) {
        console.error('Results container not found in DOM');
        return;
    }

    console.log('Searching for:', searchValue);
    resultsContainer.innerHTML = '<p>Searching...</p>';

    const fallbackData = {
        ingredients: [
            { name: 'flour', quantity: '2', unit: 'cups' },
            { name: 'sugar', quantity: '1', unit: 'cup' },
            { name: 'eggs', quantity: '2', unit: '' },
            { name: 'butter', quantity: '0.5', unit: 'cup' },
            { name: 'milk', quantity: '1', unit: 'cup' },
            { name: 'vanilla extract', quantity: '1', unit: 'teaspoon' }
        ],
        note: 'This is emergency fallback data since API calls failed'
    };

    const searchTimeout = setTimeout(() => {
        if (resultsContainer.innerHTML === '<p>Searching...</p>') {
            console.log('Search timed out, using fallback data');
            displaySearchResults(fallbackData, searchValue);
        }
    }, 8000);

    // POST request to /api/search
    fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ recipeName: searchValue })
    })
    .then(response => {
        console.log('POST response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        clearTimeout(searchTimeout);
        console.log('POST search success, data:', data);
        if (data && data.ingredients) {
            displaySearchResults(data, searchValue);
        } else {
            throw new Error('No ingredients in response');
        }
    })
    .catch(error => {
        console.error('POST attempt failed:', error);
        
        // Fallback GET request to /api/search
        fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(searchValue)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('GET response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            clearTimeout(searchTimeout);
            console.log('GET search success, data:', data);
            if (data && (data.results || data.ingredients)) {
                displaySearchResults(data, searchValue);
            } else {
                throw new Error('No useful data in response');
            }
        })
        .catch(secondError => {
            console.error('GET attempt failed:', secondError);
            clearTimeout(searchTimeout);
            console.log('All attempts failed, using fallback data');
            fallbackData.recipeName = searchValue;
            displaySearchResults(fallbackData, searchValue);
        });
    });
}

/**
 * Display search results on the page
 * @param {Object} data - The search results data
 * @param {string} searchQuery - The original search query
 */
function displaySearchResults(data, searchQuery) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }

    console.log('Displaying results:', data);

    const ingredients = data.ingredients || (data.results && data.results[0]?.ingredients) || [];
    const hasMockData = data.note && data.note.includes('mock data');

    if (ingredients.length === 0) {
        resultsContainer.innerHTML = `
            <div class="error-container">
                <h3>No results found</h3>
                <p>We couldn't find ingredients for "${searchQuery}". Please try a different recipe name.</p>
            </div>
        `;
        return;
    }

    let resultsHTML = `<h2>Ingredients for "${searchQuery}"</h2>`;
    resultsHTML += '<div class="ingredients-container">';
    resultsHTML += '<ul class="ingredients-list">';
    ingredients.forEach(ingredient => {
        resultsHTML += `
            <li class="ingredient-item">
                <span class="ingredient-name">${ingredient.name || 'Unknown'}</span>
                <span class="ingredient-quantity">${ingredient.quantity || ''} ${ingredient.unit || ''}</span>
            </li>
        `;
    });
    resultsHTML += '</ul>';
    if (hasMockData) {
        resultsHTML += '<p class="mock-data-notice">Note: Using approximate ingredient data</p>';
    }
    resultsHTML += '</div>';
    resultsHTML += `
        <div class="action-buttons">
            <button class="try-cooking-btn">Add to Kitchen</button>
            <button class="new-search-btn">New Search</button>
        </div>
    `;

    resultsContainer.innerHTML = resultsHTML;

    // Event listeners for buttons
    const tryCookingBtn = resultsContainer.querySelector('.try-cooking-btn');
    if (tryCookingBtn) {
        tryCookingBtn.addEventListener('click', function() {
            const kitchenCount = document.querySelector('.kitchen-count');
            if (kitchenCount) {
                const currentCount = parseInt(kitchenCount.textContent) || 0;
                kitchenCount.textContent = currentCount + 1;
                kitchenCount.classList.add('kitchen-count-animate');
                setTimeout(() => {
                    kitchenCount.classList.remove('kitchen-count-animate');
                }, 300);
            }
            alert(`Added ${searchQuery} to your kitchen!`);
        });
    }

    const newSearchBtn = resultsContainer.querySelector('.new-search-btn');
    if (newSearchBtn) {
        newSearchBtn.addEventListener('click', function() {
            resultsContainer.innerHTML = '';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
        });
    }
}