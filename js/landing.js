// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // If this is a navigation link, update active state
                if (this.classList.contains('nav-link')) {
                    const navLinks = document.querySelectorAll('.nav-link');
                    navLinks.forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });
}

// Setup CTA buttons with toast messages
function setupCTAButtons() {
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent.includes('Try For Free')) {
                showToast('Welcome to your free trial!', 'success');
            }
        });
    });
}

// Handle active navigation links
function setupActiveNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Set initial active link based on URL
    if (window.location.pathname.includes('index.html')) {
        const homeLink = document.querySelector('a[href="index.html"]');
        if (homeLink) {
            navLinks.forEach(l => l.classList.remove('active'));
            homeLink.classList.add('active');
        }
    }
    
    // Setup click event for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });
}

// Setup eco stats animation
function setupEcoStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate the counters
                const treesCount = document.getElementById('treesCount');
                const pagesCount = document.getElementById('pagesCount');
                const usersCount = document.getElementById('usersCount');
                
                // Add animation to counters
                const counters = document.querySelectorAll('.counter');
                counters.forEach(counter => {
                    counter.classList.add('visible');
                });
                
                // Animate counter values
                animateCounter(treesCount, 10547, 2000);
                animateCounter(pagesCount, 2563891, 2000);
                animateCounter(usersCount, 183742, 2000);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    const ecoStats = document.querySelector('.eco-stats');
    if (ecoStats) {
        observer.observe(ecoStats);
    }
}

// Show first FAQ open by default
function setupFAQs() {
    const firstFAQ = document.querySelector('.mb-4.border');
    if (firstFAQ) {
        const button = firstFAQ.querySelector('button');
        toggleFAQ(button);
    }
}

// Setup newsletter form
function setupNewsletterForm() {
    const form = document.querySelector('#newsletter form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            
            // Simple validation
            if (email && email.includes('@') && email.includes('.')) {
                showToast('Thank you for subscribing!', 'success');
                form.reset();
            } else {
                showToast('Please enter a valid email address.', 'error');
            }
        });
    }
}

// Initialize all page functionality
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
    setupSmoothScrolling();
    setupCTAButtons();
    setupActiveNavLinks();
    setupEcoStats();
    setupFAQs();
    setupNewsletterForm();
});