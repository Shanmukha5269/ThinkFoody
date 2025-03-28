// Conversion rates to grams - Base values for water (density 1g/ml)
const baseConversionRates = {
    'tablespoon': 14.787,
    'teaspoon': 4.929,
    'cup': 236.588,
    'ounce': 28.35 
};

// Density multipliers relative to water (water = 1.0)
const ingredientDensities = {
    'water': 1.0,  
    'milk': 1.03,     
    'flour': 0.53, 
    'sugar': 0.85,     
    'butter': 0.96,    
    'honey': 1.42,    
    'oil': 0.92,   
    'salt': 1.22,      
    'chocolate': 0.64,
    'rice': 0.87,          
    'tomato': 0.47 
};

document.addEventListener('DOMContentLoaded', function() {
    const convertBtn = document.getElementById('convertBtn');
    const table = document.querySelector('.conversion-table');
    const gramResults = document.getElementById('gramResults');
    
    // Initialize search functionality for dropdowns
    initializeDropdownSearch();
    
    // Initialize quantity input validation
    initializeQuantityValidation();
    
    // Initialize keyboard navigation
    initializeKeyboardNavigation();

    convertBtn.addEventListener('click', function() {
        const rows = table.querySelectorAll('tbody tr');
        let resultsHTML = '<table class="conversion-table"><thead><tr><th>Ingredients</th><th>Grams</th></tr></thead><tbody>';
        let hasValidIngredients = false;
        
        rows.forEach(row => {
            const ingredientSelect = row.querySelector('.ingredient-select');
            const quantityCell = row.querySelector('td[contenteditable="true"]');
            const measurementSelect = row.querySelector('.measurement-select');

            const ingredient = ingredientSelect.value;
            const quantity = parseFloat(quantityCell.textContent);
            const measurement = measurementSelect.value;

            if (ingredient && !isNaN(quantity) && measurement) {
                // Get base conversion rate for the measurement unit
                const baseRate = baseConversionRates[measurement] || 0;
                
                if (baseRate > 0) {
                    // Get the density multiplier for the ingredient (default to 1.0 if not found)
                    const densityMultiplier = ingredientDensities[ingredient] || 1.0;
                    
                    // Calculate grams based on quantity, base rate, and ingredient density
                    const grams = quantity * baseRate * densityMultiplier;
                    
                    hasValidIngredients = true;
                    resultsHTML += `
                        <tr>
                            <td>${ingredient}</td>
                            <td>${grams.toFixed(2)} g</td>
                        </tr>
                    `;
                }
            }
        });

        resultsHTML += '</tbody></table>';
        
        if (hasValidIngredients) {
            gramResults.innerHTML = resultsHTML;
        } else {
            gramResults.innerHTML = '<p class="no-results">Please select ingredients, enter quantities, and select measurements to convert.</p>';
        }
    });
    
    function initializeDropdownSearch() {
        const searchInputs = document.querySelectorAll('.dropdown-search');
        
        searchInputs.forEach(input => {
            // Input event for filtering options
            input.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                const select = this.nextElementSibling;
                const options = select.querySelectorAll('option');
                let hasVisibleOptions = false;
                
                options.forEach(option => {
        
                    if (option.value === '') return;
                    
                    const text = option.textContent.toLowerCase();
                    if (text.indexOf(searchTerm) !== -1) {
                        option.hidden = false;
                        hasVisibleOptions = true;
                    } else {
                        option.hidden = true;
                    }
                });
                
                // Add a class when filtering to enhance visibility
                if (searchTerm) {
                    select.classList.add('filtering');
                } else {
                    select.classList.remove('filtering');
                }
                
                // If search term matches exactly one option, select it
                const visibleOptions = Array.from(options).filter(opt => 
                    opt.value !== '' && !opt.hidden);
                
                if (visibleOptions.length === 1) {
                    select.value = visibleOptions[0].value;
                }
            });
            
            // Enter key event for selecting the first visible option
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const select = this.nextElementSibling;
                    const options = select.querySelectorAll('option');
                    const visibleOptions = Array.from(options).filter(opt => 
                        opt.value !== '' && !opt.hidden);
                    
                    if (visibleOptions.length > 0) {
                        // Select the first visible option
                        select.value = visibleOptions[0].value;
                        
                        // Trigger the change event
                        const event = new Event('change');
                        select.dispatchEvent(event);
                        
                        // Show visual feedback
                        select.classList.add('selected-by-enter');
                        setTimeout(() => {
                            select.classList.remove('selected-by-enter');
                        }, 500);
                        
                        // Different navigation based on whether this is an ingredient or measurement search
                        const cell = this.closest('td');
                        const row = cell.closest('tr');
                        
                        if (cell.cellIndex === 0) {
                            // If this is an ingredient search, move to quantity
                            const quantityCell = row.querySelector('td[contenteditable="true"]');
                            if (quantityCell) {
                                quantityCell.focus();
                            }
                        } else if (cell.cellIndex === 2) {
                            // If this is a measurement search, move to next row's ingredient
                            const nextRow = row.nextElementSibling;
                            if (nextRow) {
                                const nextIngredientSearch = nextRow.querySelector('.dropdown-search');
                                if (nextIngredientSearch) {
                                    nextIngredientSearch.focus();
                                }
                            } else {
                                // If this is the last row, focus on the convert button
                                convertBtn.focus();
                            }
                        }
                    }
                }
            });
            
            // Clear search when dropdown changes
            const select = input.nextElementSibling;
            select.addEventListener('change', function() {
                input.value = '';
                const options = this.querySelectorAll('option');
                options.forEach(option => {
                    option.hidden = false;
                });
                this.classList.remove('filtering');
            });
        });
    }
    
    // Function to initialize quantity validation (only allow numbers and decimal point)
    function initializeQuantityValidation() {
        const quantityCells = table.querySelectorAll('td[contenteditable="true"]');
        
        quantityCells.forEach(cell => {
            // Handle input event
            cell.addEventListener('input', function(e) {
                // Get the current text content
                let content = this.textContent;
                
                // Replace any non-numeric and non-decimal characters
                let cleanedContent = content.replace(/[^0-9.]/g, '');
                
                // Ensure only one decimal point
                if (cleanedContent.indexOf('.') !== cleanedContent.lastIndexOf('.')) {
                    // Keep only the first decimal point
                    let parts = cleanedContent.split('.');
                    cleanedContent = parts[0] + '.' + parts.slice(1).join('');
                }
                
                // If content has changed, update it and restore cursor position
                if (content !== cleanedContent) {
                    // Get cursor position
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const start = range.startOffset;
                    
                    // Calculate how many illegal characters were before the cursor
                    const diff = content.length - cleanedContent.length;
                    const newPosition = Math.max(0, start - diff);
                    
                    // Update content
                    this.textContent = cleanedContent;
                    
                    // Restore cursor position
                    range.setStart(this.firstChild || this, newPosition);
                    range.setEnd(this.firstChild || this, newPosition);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });
            
            // Prevent pasting of non-numeric content
            cell.addEventListener('paste', function(e) {
                e.preventDefault();
                
                // Get pasted content as text
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                
                // Clean up the pasted content
                const cleanedText = pastedText.replace(/[^0-9.]/g, '');
                
                // Insert at cursor position
                document.execCommand('insertText', false, cleanedText);
            });
            
            // Add visual indicator for editable quantity cells
            cell.classList.add('quantity-cell');
        });
    }
    
    // Function to initialize keyboard navigation between fields
    function initializeKeyboardNavigation() {
        // Handle Enter key in quantity cells to move to measurement field
        const quantityCells = table.querySelectorAll('td[contenteditable="true"]');
        quantityCells.forEach(cell => {
            cell.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    // Move to the measurement dropdown in the same row
                    const row = this.closest('tr');
                    const measurementSearch = row.querySelector('.measurement-select').previousElementSibling;
                    
                    if (measurementSearch) {
                        measurementSearch.focus();
                    }
                }
            });
        });
        
        // Handle Enter key in measurement selects to move to next row's ingredient
        const measurementSelects = table.querySelectorAll('.measurement-select');
        measurementSelects.forEach(select => {
            select.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    // Find the current row and the next row
                    const currentRow = this.closest('tr');
                    const nextRow = currentRow.nextElementSibling;
                    
                    if (nextRow) {
                        // Focus on the ingredient search of the next row
                        const nextIngredientSearch = nextRow.querySelector('.dropdown-search');
                        if (nextIngredientSearch) {
                            nextIngredientSearch.focus();
                        }
                    } else {
                        // If this is the last row, focus on the convert button
                        convertBtn.focus();
                    }
                }
            });
        });
        
        // Handle Enter in the last measurement field of the last row
        const lastRow = table.querySelector('tbody tr:last-child');
        if (lastRow) {
            const lastMeasurementSelect = lastRow.querySelector('.measurement-select');
            lastMeasurementSelect.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    convertBtn.focus();
                }
            });
        }
    }
});