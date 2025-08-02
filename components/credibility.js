// ===== CREDIBILITY RATING COMPONENT =====

// Credibility Rating Functions
function setupCredibilityRating() {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            setCredibilityRating(rating);
        });
        
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            highlightStars(rating);
        });
    });
    
    const starsContainer = document.querySelector('.stars');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => {
            const currentRating = getSelectedCredibility();
            highlightStars(currentRating);
        });
    }
}

function setCredibilityRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    const credibilityLabel = document.getElementById('credibilityLabel');
    if (credibilityLabel) {
        credibilityLabel.textContent = getCredibilityText(rating);
    }
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffa000';
        } else {
            star.style.color = '#ddd';
        }
    });
}

function getSelectedCredibility() {
    const activeStars = document.querySelectorAll('.star.active');
    return activeStars.length;
}

function getCredibilityText(rating) {
    const texts = {
        1: 'Very Low',
        2: 'Low',
        3: 'Medium',
        4: 'High',
        5: 'Very High'
    };
    return texts[rating] || 'Not rated';
}
