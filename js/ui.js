// UI-related functionality for SplitInvoice

 class UI {
   static init() {
     this.initThemeToggle();
     this.initButtonInteractions();
     this.initMobileNav();
     this.initFancyBottomNav();
     this.initDropdownSupport();
     
     // Ensure bottom navigation is visible
     this.ensureBottomNavVisible();
   }

   static initThemeToggle() {
     const themeToggle = document.getElementById('themeToggle');
     // Use 'theme' as the key
     const storedTheme = localStorage.getItem('theme'); 
     const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

     let currentTheme;

     // Priority: localStorage > System Preference > Default (Light)
     if (storedTheme) {
         currentTheme = storedTheme; // Use stored theme ('dark' or 'light')
     } else if (systemPrefersDark) {
         currentTheme = 'dark';
         // Optionally save the detected preference as the initial default
         // localStorage.setItem('theme', 'dark'); 
     } else {
         currentTheme = 'light';
         // Optionally save the detected preference as the initial default
         // localStorage.setItem('theme', 'light');
     }

     // Apply the determined theme
     if (currentTheme === 'dark') {
         document.documentElement.classList.add('dark');
     } else {
         document.documentElement.classList.remove('dark');
     }

     // Setup the toggle button listener
     if (themeToggle) {
         themeToggle.addEventListener('click', () => {
             const isCurrentlyDark = document.documentElement.classList.contains('dark');
             // Determine the new theme based on the current state
             const newTheme = isCurrentlyDark ? 'light' : 'dark'; 
             
             // Apply the new theme class
             if (newTheme === 'dark') {
                 document.documentElement.classList.add('dark');
             } else {
                 document.documentElement.classList.remove('dark');
             }
             // Store the new theme ('dark' or 'light') using the 'theme' key
             localStorage.setItem('theme', newTheme); 
         });
     }
   }

   static initButtonInteractions() {
     // Add hover effect for action buttons
     document.querySelectorAll('.action-buttons .btn').forEach(button => {
       button.addEventListener('mouseenter', () => {
         button.style.transform = 'translateY(-2px)';
       });
       
       button.addEventListener('mouseleave', () => {
         button.style.transform = 'translateY(0)';
       });
     });

     // Add active state for mobile nav items
     document.querySelectorAll('.nav-item').forEach(item => {
       item.addEventListener('click', () => {
         document.querySelectorAll('.nav-item').forEach(navItem => {
           navItem.classList.remove('active');
         });
         item.classList.add('active');
       });
     });
   }

   static initMobileNav() {
     const mobileTemplateBtn = document.getElementById('mobileTemplateBtn');
     const templateBtn = document.getElementById('templateBtn');
     
     if (mobileTemplateBtn && templateBtn) {
       mobileTemplateBtn.addEventListener('click', () => {
         templateBtn.click();
       });
     }
     
     // Add event listener for history button in mobile navigation
     const historyBtns = document.querySelectorAll('#historyBtn');
     historyBtns.forEach(btn => {
       if (btn) {
         btn.addEventListener('click', () => {
           if (typeof History !== 'undefined' && History.openHistoryModal) {
             History.openHistoryModal();
           }
         });
       }
     });
   }

   static initFancyBottomNav() {
     // Add pulse animation to the center button
     const addButton = document.getElementById('addButton');
     if (addButton) {
       addButton.classList.add('pulse-animation');
       addButton.addEventListener('click', () => {
         // Visual feedback - scaling animation
         addButton.classList.toggle('pulse-animation');
         addButton.classList.add('transform', 'scale-110');
         
         // Add ripple effect
         const ripple = document.createElement('div');
         ripple.classList.add('absolute', 'inset-0', 'bg-white', 'rounded-full', 'opacity-30');
         addButton.appendChild(ripple);
         
         // Animate the ripple
         ripple.animate(
           [
             { transform: 'scale(0)', opacity: 0.8 },
             { transform: 'scale(2)', opacity: 0 }
           ],
           {
             duration: 600,
             easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
           }
         );
         
         // Remove ripple after animation
         setTimeout(() => {
           ripple.remove();
           addButton.classList.remove('transform', 'scale-110');
           
           // Add new bill or show actions
           Person.addPersonField();
           
           // Restore pulse animation after a delay
           setTimeout(() => {
             addButton.classList.add('pulse-animation');
           }, 1000);
         }, 300);
       });
     }
     
     // Connect the history button in the bottom nav
     const historyBtnNav = document.getElementById('historyBtnNav');
     if (historyBtnNav) {
       historyBtnNav.addEventListener('click', () => {
         if (typeof History !== 'undefined' && History.openHistoryModal) {
           History.openHistoryModal();
         }
       });
     }
     
     // Connect the settings button
     const settingsBtn = document.getElementById('settingsBtn');
     if (settingsBtn) {
       settingsBtn.addEventListener('click', () => {
         UI.openSettings();
       });
     }
     
     // Fix Home button navigation and add active nav item highlighting
     const navItems = document.querySelectorAll('.bottom-navigation .nav-item');
     navItems.forEach(item => {
       item.addEventListener('click', (e) => {
         // Handle special case for home button
         if (item.querySelector('.fa-home') && item.getAttribute('href') === '#') {
           e.preventDefault();
           
           // Redirect to index page if we're not already there
           const currentPath = window.location.pathname;
           if (!currentPath.endsWith('index.html') && !currentPath.endsWith('/')) {
             window.location.href = 'index.html';
             return;
           }
         }
         
         // Update active status for all nav items
         navItems.forEach(navItem => {
           navItem.classList.remove('active');
         });
         item.classList.add('active');
       });
     });
   }
   
   // New method to enhance dropdown functionality
   static initDropdownSupport() {
     // Initialize all person name dropdowns
     this.initExistingPersonDropdowns();
     
     // Set up mutation observer to catch dynamically added dropdowns
     this.watchForNewDropdowns();
     
     // Add click handler on personFields container for delegation
     const personFieldsContainer = document.getElementById('personFields');
     if (personFieldsContainer) {
       personFieldsContainer.addEventListener('click', (e) => {
         // Find if click was on a person name element
         const personName = e.target.closest('.personName');
         if (personName) {
           const dropdown = personName.parentElement.querySelector('.name-dropdown');
           // Only proceed if we found both elements
           if (dropdown) {
             // Show the dropdown
             dropdown.classList.remove('hidden');
             
             // Position the dropdown correctly
             this.positionDropdown(dropdown);
             
             // Stop event propagation
             e.stopPropagation();
           }
         }
       });
     }
     
     // Add document click handler to close open dropdowns
     document.addEventListener('click', (e) => {
       const openDropdowns = document.querySelectorAll('.name-dropdown:not(.hidden)');
       openDropdowns.forEach(dropdown => {
         const personName = dropdown.parentElement.querySelector('.personName');
         if (!personName.contains(e.target) && !dropdown.contains(e.target)) {
           dropdown.classList.add('hidden');
         }
       });
     });
   }
   
   // Initialize all existing person name dropdowns
   static initExistingPersonDropdowns() {
     const personNames = document.querySelectorAll('.personName');
     personNames.forEach(personName => {
       // Ensure dropdown exists
       const dropdown = personName.parentElement.querySelector('.name-dropdown');
       if (dropdown) {
         // Mark dropdown as initialized
         dropdown.dataset.dropdownInitialized = 'true';
         
         // Make sure Person.createNameDropdown is called for this element
         if (typeof Person !== 'undefined' && Person.createNameDropdown) {
           Person.createNameDropdown(personName);
         }
       }
     });
   }
   
   // Watch for new dropdowns being added to the DOM
   static watchForNewDropdowns() {
     const observer = new MutationObserver((mutations) => {
       mutations.forEach(mutation => {
         if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
           mutation.addedNodes.forEach(node => {
             // Check if it's an element node
             if (node.nodeType === 1) {
               // Look for person name elements
               const personNames = node.querySelectorAll ? node.querySelectorAll('.personName') : [];
               personNames.forEach(personName => {
                 // Initialize dropdown functionality for this new element
                 if (typeof Person !== 'undefined' && Person.createNameDropdown) {
                   Person.createNameDropdown(personName);
                 }
               });
             }
           });
         }
       });
     });
     
     // Start observing the document body for dynamically added content
     observer.observe(document.body, { childList: true, subtree: true });
   }
   
   // Position dropdown correctly
   static positionDropdown(dropdown) {
     const personField = dropdown.closest('.person-field');
     const personName = personField.querySelector('.personName');
     const rect = personName.getBoundingClientRect();
     
     // Apply fixed positioning and high z-index
     dropdown.style.position = 'fixed';
     dropdown.style.top = `${rect.bottom + window.scrollY}px`;
     dropdown.style.left = `${rect.left + window.scrollX}px`;
     dropdown.style.width = `${rect.width}px`;
     dropdown.style.zIndex = '9999';
   }

   static showToast(message, type = 'info') {
     const toast = document.createElement('div');
     toast.className = `toast bg-${type} text-white`;
     toast.innerHTML = `
       <i class="fas fa-${this.getToastIcon(type)} mr-2"></i>
       <span>${message}</span>
     `;

     const container = document.getElementById('toastContainer');
     if (container) {
       container.appendChild(toast);
       setTimeout(() => {
         toast.remove();
       }, 3000);
     }
   }

   static getToastIcon(type) {
     switch (type) {
       case 'success':
         return 'check-circle';
       case 'error':
         return 'exclamation-circle';
       case 'warning':
         return 'exclamation-triangle';
       default:
         return 'info-circle';
     }
   }

   static openSettings() {
     const modal = document.getElementById('settingsModal');
     if (modal) {
       modal.classList.remove('hidden');
     }
   }
   
   static openSettingsModal() {
     // First try to find the settings modal
     const modal = document.getElementById('settingsModal');
     if (modal) {
       modal.classList.remove('hidden');
       return;
     }
     
     // If modal not found, create a temporary settings modal
     const tempModal = document.createElement('div');
     tempModal.id = 'settingsModal';
     tempModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50';
     
     tempModal.innerHTML = `
       <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-2xl modal-content max-w-md">
         <div class="mt-3">
           <div class="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-700">
             <h3 class="text-lg font-medium text-gray-900 dark:text-white">
               <i class="fas fa-cog mr-2"></i>Settings
             </h3>
             <button onclick="UI.closeSettings()" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
               <i class="fas fa-times"></i>
             </button>
           </div>
           
           <div class="space-y-4">
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
               <div class="flex items-center justify-between">
                 <span>Dark Mode</span>
                 <label class="switch">
                   <input type="checkbox" id="darkModeToggle" ${document.documentElement.classList.contains('dark') ? 'checked' : ''}>
                   <span class="slider round"></span>
                 </label>
               </div>
             </div>
             
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
               <select id="currencySelect" class="w-full px-3 py-2 border rounded-xl dark:bg-dark-card dark:border-gray-600 dark:text-white">
                 <option value="USD">USD ($)</option>
                 <option value="EUR">EUR (€)</option>
                 <option value="GBP">GBP (£)</option>
                 <option value="JPY">JPY (¥)</option>
                 <option value="CAD">CAD ($)</option>
               </select>
             </div>
             
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget Settings</label>
               <input type="number" id="monthlyBudget" placeholder="Monthly Budget" class="w-full px-3 py-2 border rounded-xl dark:bg-dark-card dark:border-gray-600 dark:text-white" value="650">
             </div>
           </div>
           
           <div class="flex justify-end mt-6">
             <button onclick="UI.closeSettings()" class="btn btn-secondary mr-2">
               Cancel
             </button>
             <button onclick="UI.saveSettings()" class="btn btn-primary">
               Save
             </button>
           </div>
         </div>
       </div>
     `;
     
     document.body.appendChild(tempModal);
     
     // Add event listener for dark mode toggle
     const darkModeToggle = document.getElementById('darkModeToggle');
     if (darkModeToggle) {
       darkModeToggle.addEventListener('change', function() {
         const isDark = document.documentElement.classList.toggle('dark');
         localStorage.setItem('theme', isDark ? 'dark' : 'light'); // Use 'theme' key and 'dark'/'light' values
       });
     }
   }

   static closeSettings() {
     const modal = document.getElementById('settingsModal');
     if (modal) {
       modal.classList.add('hidden');
     }
   }

   static saveSettings() {
     // Save settings logic here
     this.showToast('Settings saved successfully', 'success');
     this.closeSettings();
   }

   static ensureBottomNavVisible() {
     // Make sure the bottom navigation is visible
     const bottomNav = document.querySelector('.bottom-navigation');
     if (bottomNav) {
       // Ensure it's visible with inline styles as a fallback
       bottomNav.style.display = 'flex';
       bottomNav.style.visibility = 'visible';
       bottomNav.style.opacity = '1';
       bottomNav.style.zIndex = '9999';
       bottomNav.style.position = 'fixed';
       bottomNav.style.bottom = '0';
       bottomNav.style.left = '0';
       bottomNav.style.right = '0';
       bottomNav.style.width = '100%';
       
       // Make it really important
       bottomNav.setAttribute('style', 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 9999 !important; position: fixed !important; right: 0 !important; width: 100% !important; padding-top: 10px !important; padding-bottom: 10px !important;');
       
       // Fix any potential layout issues by forcing a reflow
       setTimeout(() => {
         window.dispatchEvent(new Event('resize'));
         
         // Check again after a short delay to be extra sure
         setTimeout(() => {
           bottomNav.setAttribute('style', 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 9999 !important; position: fixed !important; right: 0 !important; width: 100% !important; padding-top: 10px !important; padding-bottom: 10px !important;');
           console.log('Bottom navigation visibility reinforced after delay');
         }, 500);
       }, 100);
       
       // Log visibility status for debugging
       console.log('Bottom navigation initialized and forced visible');
     } else {
       console.warn('Bottom navigation element not found');
       
       // Create the navigation if it's missing
       this.createBottomNavIfMissing();
     }
   }
   
   static createBottomNavIfMissing() {
     // Check if navigation exists
     if (!document.querySelector('.bottom-navigation')) {
       console.log('Creating missing bottom navigation');
       
       // Create the navigation element
       const navElement = document.createElement('div');
       navElement.className = 'bottom-navigation fixed bottom-0 right-0 bg-white dark:bg-dark-card backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 p-2 rounded-t-3xl shadow-lg z-50';
       navElement.id = 'bottomNavigation';
       navElement.setAttribute('style', 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 9999 !important; position: fixed !important; right: 0 !important; width: 100% !important; padding-top: 10px !important; padding-bottom: 10px !important;');
       
       // Create the inner HTML
       navElement.innerHTML = `
         <div class="max-w-lg mx-auto flex justify-around items-center w-full">
           <a href="index.html" class="nav-item flex flex-col items-center px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200 active">
             <i class="fas fa-home text-xl"></i>
             <span class="text-xs mt-1">Home</span>
           </a>
           <a href="statistics.html" class="nav-item flex flex-col items-center px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200">
             <i class="fas fa-chart-bar text-xl"></i>
             <span class="text-xs mt-1">Stats</span>
           </a>
           <div class="relative flex justify-center items-center">
             <button id="addButton" class="nav-item-center bg-accent-purple hover:bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 relative overflow-hidden">
               <i class="fas fa-plus text-2xl"></i>
             </button>
           </div>
           <button id="historyBtnNav" class="nav-item flex flex-col items-center px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200">
             <i class="fas fa-history text-xl"></i>
             <span class="text-xs mt-1">History</span>
           </button>
           <button id="settingsBtn" class="nav-item flex flex-col items-center px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200">
             <i class="fas fa-cog text-xl"></i>
             <span class="text-xs mt-1">Settings</span>
           </button>
         </div>
       `;
       
       // Append to body
       document.body.appendChild(navElement);
       
       // Initialize its behavior
       setTimeout(() => {
         this.initFancyBottomNav();
       }, 100);
     }
   }
 }

 // Initialize UI when document is ready
 document.addEventListener('DOMContentLoaded', () => {
   UI.init();
 });