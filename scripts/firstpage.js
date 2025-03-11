        // Scroll to home section on page load
        window.onload = function() {
            if (window.location.hash !== '#home') {
                window.location.hash = 'home';
            }
            
            // Add smooth scrolling for anchor links
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
        };