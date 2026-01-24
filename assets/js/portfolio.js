// ===================================
// BRUTALIST MINIMALISM PORTFOLIO
// Interaction Layer
// ===================================

(function() {
    'use strict';

    // Project hover interactions
    function initProjectHovers() {
        const projectItems = document.querySelectorAll('.project-item');
        const previewContents = document.querySelectorAll('.preview-content');

        projectItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                const projectId = this.getAttribute('data-project');
                
                // Hide all previews
                previewContents.forEach(preview => {
                    preview.classList.remove('active');
                });

                // Show matching preview
                const activePreview = document.querySelector(`[data-preview="${projectId}"]`);
                if (activePreview) {
                    activePreview.classList.add('active');
                }
            });
        });

        // Show first project by default
        if (projectItems.length > 0 && previewContents.length > 0) {
            const firstProject = projectItems[0].getAttribute('data-project');
            const firstPreview = document.querySelector(`[data-preview="${firstProject}"]`);
            if (firstPreview) {
                firstPreview.classList.add('active');
            }
        }
    }

    // Vibe section interactions
    function initVibeHovers() {
        const vibeItems = document.querySelectorAll('.vibe-item');

        vibeItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                vibeItems.forEach(vi => vi.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Smooth scroll for navigation
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Scroll snap section tracking
    function initScrollTracking() {
        const sections = document.querySelectorAll('section');
        const scrollDots = document.querySelectorAll('.scroll-dot');
        const homeIcon = document.querySelector('.nav');
        let currentSection = 0;

        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionIndex = Array.from(sections).indexOf(entry.target);
                    currentSection = sectionIndex;
                    
                    // Update scroll indicator
                    scrollDots.forEach((dot, index) => {
                        if (index === sectionIndex) {
                            dot.classList.add('active');
                        } else {
                            dot.classList.remove('active');
                        }
                    });
                    
                    // Show/hide home icon (only show from 3rd scroll - section index 2)
                    if (homeIcon) {
                        if (sectionIndex >= 2) {
                            homeIcon.classList.add('visible');
                        } else {
                            homeIcon.classList.remove('visible');
                        }
                    }
                    
                    // Track section view
                    const sectionId = entry.target.id || entry.target.className.split(' ')[0];
                    trackInteraction('Scroll', 'view_section', sectionId);
                }
            });
        }, observerOptions);

        // Observe all sections
        sections.forEach(section => {
            observer.observe(section);
        });

        // Click handler for scroll dots
        scrollDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                sections[index].scrollIntoView({ behavior: 'smooth' });
                trackInteraction('Navigation', 'scroll_dot_click', `section_${index}`);
            });
        });
    }

    // Keyboard navigation for scroll sections
    function initKeyboardNav() {
        const sections = document.querySelectorAll('section');
        
        document.addEventListener('keydown', (e) => {
            // Arrow down or Page Down
            if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                e.preventDefault();
                const currentScroll = window.scrollY;
                const nextSection = Array.from(sections).find(
                    section => section.offsetTop > currentScroll + 10
                );
                if (nextSection) {
                    nextSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
            
            // Arrow up or Page Up
            if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                const currentScroll = window.scrollY;
                const prevSection = Array.from(sections).reverse().find(
                    section => section.offsetTop < currentScroll - 10
                );
                if (prevSection) {
                    prevSection.scrollIntoView({ behavior: 'smooth' });
                }
            }

            // Home key
            if (e.key === 'Home') {
                e.preventDefault();
                sections[0].scrollIntoView({ behavior: 'smooth' });
            }

            // End key
            if (e.key === 'End') {
                e.preventDefault();
                sections[sections.length - 1].scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Analytics tracking
    function trackInteraction(category, action, label) {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        
        if (typeof heap === 'object' && heap.track) {
            heap.track(action, {
                category: category,
                label: label
            });
        }
    }

    // Track project hovers
    function initAnalytics() {
        const projectItems = document.querySelectorAll('.project-item');
        projectItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                const projectName = this.querySelector('.project-title').textContent;
                trackInteraction('Projects', 'hover', projectName);
            });
        });
    }

    // Handle image loading errors
    function initImageFallbacks() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('error', function() {
                // Create placeholder
                const placeholder = document.createElement('div');
                placeholder.style.width = '100%';
                placeholder.style.height = '400px';
                placeholder.style.backgroundColor = '#1a1a1a';
                placeholder.style.display = 'flex';
                placeholder.style.alignItems = 'center';
                placeholder.style.justifyContent = 'center';
                placeholder.style.color = '#666';
                placeholder.style.fontSize = '14px';
                placeholder.textContent = 'Image coming soon';
                
                this.parentNode.replaceChild(placeholder, this);
            });
        });
    }

    // Initialize everything when DOM is ready
    function init() {
        initProjectHovers();
        initVibeHovers();
        initSmoothScroll();
        initScrollTracking();
        initKeyboardNav();
        initAnalytics();
        initImageFallbacks();

        // Log initialization
        console.log('Portfolio initialized with scroll snap (5 sections)');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
