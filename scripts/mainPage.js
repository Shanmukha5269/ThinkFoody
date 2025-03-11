// Main Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Navigation active state
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Update URL without page reload
                history.pushState(null, null, targetId);
            }
        });
    });

    // Search recommendations functionality
    const searchInput = document.querySelector('.search-input');
    const recommendationBtns = document.querySelectorAll('.recommendation-btn');
    
    recommendationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            searchInput.value = this.textContent;
            searchInput.focus();
            
            // Simulate search (for demo purposes)
            // In a real application, this would trigger a search function
            console.log(`Searching for: ${this.textContent}`);
        });
    });

    // Kitchen counter functionality
    const kitchenBtn = document.querySelector('.kitchen-btn');
    const kitchenCount = document.querySelector('.kitchen-count');
    let count = 0;

    // Function to add recipe to kitchen
    function addToKitchen() {
        count++;
        kitchenCount.textContent = count;
        
        // Add animation to kitchen count
        kitchenCount.classList.add('kitchen-count-animate');
        setTimeout(() => {
            kitchenCount.classList.remove('kitchen-count-animate');
        }, 300);
    }

    // Search functionality
    const searchButton = document.querySelector('.search-button');
    
    searchButton.addEventListener('click', function() {
        const searchValue = searchInput.value.trim().toLowerCase();
        if (searchValue) {
            console.log(`Performing search for: ${searchValue}`);
            // In a real application, this would filter recipes or make an API call
            alert(`Searching for: ${searchValue}`);
        }
    });

    // Handle Enter key in search input
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });
});
