// Conversion rates to grams
const conversionRates = {
    'tablespoon': 14.787,
    'teaspoon': 4.929,
    'cup': 236.588
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
        
        rows.forEach(row => {
            const ingredientSelect = row.querySelector('.ingredient-select');
            const quantityCell = row.querySelector('td:nth-child(2)');
            const measurementSelect = row.querySelector('.measurement-select');

            const ingredient = ingredientSelect.value;
            const quantity = parseFloat(quantityCell.textContent);
            const measurement = measurementSelect.value;

            if (ingredient && !isNaN(quantity) && measurement) {
                const conversionRate = conversionRates[measurement] || 0;
                const grams = quantity * conversionRate;
                
                if (conversionRate > 0) {
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
        gramResults.innerHTML = resultsHTML;
    });
    
    // Function to initialize dropdown search functionality
    function initializeDropdownSearch() {
        const searchInputs = document.querySelectorAll('.dropdown-search');
        
        searchInputs.forEach(input => {
            // Input event for filtering options
            input.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                const select = this.nextElementSibling;
                const options = select.querySelectorAll('option');
                
                options.forEach(option => {
                    // Skip the first placeholder option
                    if (option.value === '') return;
                    
                    const text = option.textContent.toLowerCase();
                    if (text.indexOf(searchTerm) !== -1) {
                        option.style.display = '';
                    } else {
                        option.style.display = 'none';
                    }
                });
                
                // If search term matches exactly one option, select it
                const visibleOptions = Array.from(options).filter(opt => 
                    opt.value !== '' && opt.style.display !== 'none');
                
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
                        opt.value !== '' && opt.style.display !== 'none');
                    
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
                            const quantityCell = row.querySelector('td:nth-child(2)');
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
                    option.style.display = '';
                });
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