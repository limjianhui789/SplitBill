// Page transitions and animations for SplitInvoice

const Transitions = {
  // Initialize transitions
  init: function() {
    this.setupPageTransitions();
    this.setupMicroInteractions();
    this.setupGestures();
  },
  
  // Set up page transitions
  setupPageTransitions: function() {
    // Set up links with transitions
    this.setupLinkTransitions();
    
    // Note: We're not handling popstate events anymore
    // as we're not using History API with file:// protocol
  },
  
  // Attach click event to links for smooth transitions
  setupLinkTransitions: function() {
    const self = this;
    document.querySelectorAll('a').forEach(link => {
      // Skip external links or links that should open in new window
      if (link.getAttribute('target') === '_blank' || 
          link.getAttribute('rel') === 'external' ||
          (link.getAttribute('href') && link.getAttribute('href').startsWith('http'))) {
        return;
      }
      
      // Add click event listener with the link as the context
      link.addEventListener('click', function(e) {
        // Skip if modifier keys are pressed
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return;
        }
        
        e.preventDefault();
        const href = this.getAttribute('href');
        
        // Don't transition to the current page
        if (href === window.location.pathname) {
          return;
        }
        
        // Play exit animation then navigate to the new page (no pushState)
        self.transitionToPage(href);
      });
    });
  },
  
  // Transition to a new page
  transitionToPage: function(href, isBack = false) {
    // Get active nav item
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
      activeNav.classList.remove('active');
    }
    
    // Direction of animation
    const direction = isBack ? 'rtl' : 'ltr'; // right-to-left or left-to-right
    
    // Play exit animation
    this.playExitAnimation(direction).then(() => {
      // Simple navigation without using History API
      window.location.href = href;
    });
  },
  
  // Play exit animation before page load
  playExitAnimation: function(direction) {
    return new Promise(resolve => {
      const container = document.querySelector('.app-container');
      if (!container) {
        resolve();
        return;
      }
      
      // Add exit animation class
      if (direction === 'rtl') {
        container.classList.add('animate-exit-right');
      } else {
        container.classList.add('animate-exit-left');
      }
      
      // Resolve after animation completes
      setTimeout(resolve, 300);
    });
  },
  
  // Play entrance animation after page load
  playEntranceAnimation: function() {
    const container = document.querySelector('.app-container');
    if (!container) return;
    
    // Add entrance animation class
    container.classList.add('animate-entrance');
    
    // Remove animation class after it completes
    setTimeout(() => {
      container.classList.remove('animate-entrance');
    }, 500);
  },
  
  // Set up micro interactions
  setupMicroInteractions: function() {
    // Add ripple effect to buttons
    document.querySelectorAll('.btn, .nav-item, .tab-item').forEach(button => {
      // Bind the event properly to maintain context
      button.addEventListener('click', this.createRippleEffect.bind(button));
    });
    
    // Add scale effect to card on touch
    document.querySelectorAll('.person-field').forEach(card => {
      card.addEventListener('touchstart', () => {
        card.classList.add('scale-102');
      }, { passive: true });
      
      card.addEventListener('touchend', () => {
        card.classList.remove('scale-102');
      }, { passive: true });
    });
    
    // Animate calculator button
    const calculateBtn = document.querySelector('button[onclick="Calculator.calculate()"]');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => {
        calculateBtn.classList.add('animate-pulse');
        setTimeout(() => {
          calculateBtn.classList.remove('animate-pulse');
        }, 1000);
      });
    }
  },
  
  // Set up touch gestures using Hammer.js
  setupGestures: function() {
    if (typeof Hammer === 'undefined') return;
    
    // Setup swipe to remove on food items
    this.setupFoodItemSwipe();
    
    // Setup pull to refresh
    this.setupPullToRefresh();
    
    // Setup swipe navigation between pages
    this.setupSwipeNavigation();
  },
  
  // Setup swipe to remove on food items
  setupFoodItemSwipe: function() {
    document.querySelectorAll('.person-food-list li').forEach(item => {
      const hammer = new Hammer(item);
      
      hammer.on('swipeleft swiperight', (e) => {
        // Add swipe animation class
        item.classList.add('swiped-' + (e.type === 'swipeleft' ? 'left' : 'right'));
        
        // Remove the item after animation
        setTimeout(() => {
          item.remove();
          
          // Auto-calculate if enabled
          if (localStorage.getItem('autoCalculate') === 'true') {
            Calculator.calculate();
          }
        }, 300);
      });
    });
  },
  
  // Setup pull to refresh
  setupPullToRefresh: function() {
    const container = document.querySelector('.app-container');
    if (!container) return;
    
    let startY = 0;
    let currentY = 0;
    const MAX_PULL = 100;
    
    // Create pull indicator
    const indicator = document.createElement('div');
    indicator.className = 'pull-indicator hidden';
    indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
    container.prepend(indicator);
    
    // Touch start
    container.addEventListener('touchstart', (e) => {
      // Only enable pull to refresh when scrolled to top
      if (window.scrollY > 0) return;
      
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    // Touch move
    container.addEventListener('touchmove', (e) => {
      // Only enable pull to refresh when scrolled to top
      if (window.scrollY > 0) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = Math.min(currentY - startY, MAX_PULL);
      
      if (pullDistance > 0) {
        container.style.transform = `translateY(${pullDistance / 2}px)`;
        indicator.classList.remove('hidden');
        indicator.style.opacity = pullDistance / MAX_PULL;
        
        // Start rotating the icon when pulled enough
        if (pullDistance > MAX_PULL * 0.7) {
          indicator.classList.add('rotating');
        } else {
          indicator.classList.remove('rotating');
        }
      }
    }, { passive: true });
    
    // Touch end
    container.addEventListener('touchend', () => {
      // Only enable pull to refresh when scrolled to top
      if (window.scrollY > 0) return;
      
      const pullDistance = currentY - startY;
      
      // Reset position with animation
      container.style.transition = 'transform 0.3s ease';
      container.style.transform = '';
      
      // Reset indicator
      indicator.classList.add('hidden');
      indicator.classList.remove('rotating');
      
      // If pulled enough, refresh the page
      if (pullDistance > MAX_PULL * 0.7) {
        // Show loading animation
        Utils.showToast('Refreshing...', 'info');
        
        // Reload after animation
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
      
      // Reset transition after animation
      setTimeout(() => {
        container.style.transition = '';
      }, 300);
    }, { passive: true });
  },
  
  // Setup swipe navigation between pages
  setupSwipeNavigation: function() {
    const self = this;
    const body = document.body;
    const hammer = new Hammer(body);
    
    // Enable horizontal swiping
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    
    // Handle swipe
    hammer.on('swiperight swipeleft', (e) => {
      // Get all nav items
      const navItems = Array.from(document.querySelectorAll('.nav-item[href]'));
      if (navItems.length === 0) return;
      
      // Find the active nav item
      const activeIndex = navItems.findIndex(item => item.classList.contains('active'));
      if (activeIndex === -1) return;
      
      // Determine target index based on swipe direction
      let targetIndex;
      if (e.type === 'swiperight') {
        // Swipe right means go left (previous)
        targetIndex = activeIndex - 1;
      } else {
        // Swipe left means go right (next)
        targetIndex = activeIndex + 1;
      }
      
      // Check if target index is valid
      if (targetIndex >= 0 && targetIndex < navItems.length) {
        // Navigate to the target page
        const targetHref = navItems[targetIndex].getAttribute('href');
        if (targetHref) {
          // Transition to the target page without using History API
          self.transitionToPage(targetHref, e.type === 'swiperight');
        }
      }
    });
  },
  
  // Create ripple effect on button click
  createRippleEffect: function(event) {
    // 'this' now refers to the button element due to bind()
    const button = this;
    
    // Create a ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    
    // Get button position
    const rect = button.getBoundingClientRect();
    
    // Calculate ripple position relative to the button
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Position ripple
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // Add ripple to button
    button.appendChild(ripple);
    
    // Remove ripple after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
};

// Initialize transitions when document is ready
document.addEventListener('DOMContentLoaded', () => {
  Transitions.init();
  
  // Play entrance animation
  Transitions.playEntranceAnimation();
  
  // Add mutation observer to handle dynamically added elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // Check for new food items
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches('.person-food-list li')) {
            // Setup swipe gesture for new food item
            const hammer = new Hammer(node);
            hammer.on('swipeleft swiperight', (e) => {
              node.classList.add('swiped-' + (e.type === 'swipeleft' ? 'left' : 'right'));
              setTimeout(() => {
                node.remove();
                if (localStorage.getItem('autoCalculate') === 'true') {
                  Calculator.calculate();
                }
              }, 300);
            });
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });
}); 