        // Scroll to home section on page load
        window.onload = function() {
            if (window.location.hash !== '#home') {
                window.location.hash = 'home';
            }
            
            // Add smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        };