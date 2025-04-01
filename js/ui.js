// UI-related functionality for SplitInvoice

  class UI {
    static init() {
      this.initThemeToggle();
      this.initButtonInteractions();
      this.initMobileNav();

      // Check if bottom nav exists before initializing its specific features
      const bottomNav = document.querySelector('.bottom-navigation');
      if (bottomNav) {
        this.initFancyBottomNav(); // Initialize animations, history, settings buttons
      } else {
         // If the nav doesn't exist on initial load, attempt to create it.
         // This handles cases where it might be missing from the static HTML.
         console.warn("Bottom navigation not found in initial HTML, attempting to create.");
         this.createBottomNavIfMissing(); // This will also call initFancyBottomNav and setActiveNavItem after creation
         // No return needed, let the rest of init run if necessary, but setActiveNavItem is called within createBottomNavIfMissing
      }

      // Always try to set the active nav item based on the current page URL if nav exists
      // This needs to run *after* potential creation.
      this.setActiveNavItem();
      // Initialize dropdowns after potential nav creation and other UI setups
      this.initDropdownSupport();
      // Set initial currency display based on saved preference or default
      const savedCurrency = localStorage.getItem('currency') || 'SGD'; // Default to SGD
      this.updateUICurrency(savedCurrency);

    } // End of init() method

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

      // Apply the determined theme (Do this early before DOMContentLoaded listener if possible)
      // See global initialization block at the end for immediate application

      // Setup the toggle button listener (usually in settings modal now)
      // This listener here might be redundant if only handled in the modal
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
      // Add hover effect for action buttons (e.g., Save Bill, Calculate)
      document.querySelectorAll('.action-buttons .btn').forEach(button => {
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'translateY(-2px)';
          button.style.transition = 'transform 0.2s ease-out'; // Add smooth transition
        });

        button.addEventListener('mouseleave', () => {
          button.style.transform = 'translateY(0)';
        });
      });

      // Removed the nav-item active state listener from here - handled by setActiveNavItem and browser navigation.
    }

    static initMobileNav() {
      // Logic for mobile-specific navigation elements if any (e.g., mobile template button)
      const mobileTemplateBtn = document.getElementById('mobileTemplateBtn');
      const templateBtn = document.getElementById('templateBtn'); // Assuming this exists

      if (mobileTemplateBtn && templateBtn) {
        mobileTemplateBtn.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default if it's a link/button
          templateBtn.click(); // Trigger the main template button action
        });
      }

      // Example: Connect mobile history button if different from bottom nav
      const historyBtnMobile = document.getElementById('historyBtnMobile'); // Example ID
       if (historyBtnMobile) {
           historyBtnMobile.addEventListener('click', () => {
               if (typeof History !== 'undefined' && History.openHistoryModal) {
                   History.openHistoryModal();
               }
           });
       }
    }

    static initFancyBottomNav() {
      // This function should ONLY initialize interactions for an EXISTING bottom nav.
      const bottomNav = document.querySelector('.bottom-navigation');
      if (!bottomNav) {
        console.error("initFancyBottomNav called but .bottom-navigation not found.");
        return;
      }

      // Add pulse animation to the center button
      const addButton = bottomNav.querySelector('#addButton'); // Scope query to nav
      if (addButton) {
          // Check if listener already attached to prevent duplicates
          if (addButton.dataset.listenerAttached === 'true') {
             console.warn("Listener already attached to #addButton. Skipping.");
             return;
          }
          addButton.dataset.listenerAttached = 'true'; // Mark as attached

        addButton.classList.add('pulse-animation'); // Assuming this class exists in CSS
        addButton.addEventListener('click', () => {
          // Visual feedback - scaling animation
          addButton.classList.toggle('pulse-animation'); // Toggle pulse on interaction
          addButton.classList.add('transform', 'scale-110'); // Scale up

          // Add ripple effect (consider a library or simplified CSS approach)
          const ripple = document.createElement('div');
          ripple.classList.add('absolute', 'inset-0', 'bg-white', 'rounded-full', 'opacity-30', 'animate-ripple'); // Use CSS animation
          addButton.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600); // Remove after animation duration


          // Remove scaling and potentially re-add pulse after action
          setTimeout(() => {
            addButton.classList.remove('transform', 'scale-110');
            // Initiate invoice scan action
            if (typeof Scan !== 'undefined' && Scan.initiateScan) {
                Scan.initiateScan(); // <<< THE ACTUAL CALL
            } else {
                console.error("Scan module or initiateScan function not found.");
                // Optionally show a user-facing error message
                // UI.showToast("Scan feature is currently unavailable.", "error");
            }
            // Restore pulse animation after a delay (optional)
            setTimeout(() => {
              if (!addButton.classList.contains('pulse-animation')) { // Add back only if removed
                  addButton.classList.add('pulse-animation');
              }
            }, 500);
          }, 300); // Delay matches ripple removal
        });
      }

      // Connect the history button in the bottom nav
      const historyBtnNav = bottomNav.querySelector('#historyBtnNav'); // Scope query
      if (historyBtnNav) {
        // Check if listener already attached
        if (historyBtnNav.dataset.listenerAttached !== 'true') {
            historyBtnNav.dataset.listenerAttached = 'true';
            historyBtnNav.addEventListener('click', () => {
              if (typeof History !== 'undefined' && History.openHistoryModal) {
                History.openHistoryModal();
              }
            });
        }
      }

      // Connect the settings button
      const settingsBtn = bottomNav.querySelector('#settingsBtn'); // Scope query
      if (settingsBtn) {
         // Check if listener already attached
         if (settingsBtn.dataset.listenerAttached !== 'true') {
            settingsBtn.dataset.listenerAttached = 'true';
            settingsBtn.addEventListener('click', () => {
              UI.openSettingsModal(); // Use the method that handles creation if needed
            });
         }
      }

      // Home button navigation link (<a> tag) - standard browser behavior handles this.
      // No special JS needed here if the href="index.html" is correct.
      // The setActiveNavItem function handles the highlighting on page load.

    } // End of initFancyBottomNav

    // Set initial active state for bottom navigation based on current page URL
    static setActiveNavItem() {
        const bottomNav = document.querySelector('.bottom-navigation');
        if (!bottomNav) return; // Don't proceed if nav doesn't exist

        const navItems = bottomNav.querySelectorAll('.nav-item, .nav-item-center'); // Include center button if it can be active
        if (!navItems.length) {
            return; // No items to process
        }

        // Get the full path and extract the filename robustly
        let currentPath = window.location.pathname;
        // Remove leading/trailing slashes for consistency
        currentPath = currentPath.replace(/^\/+|\/+$/g, '');
        const pathSegments = currentPath.split('/');
        // Default to index.html if path is empty or just refers to the root
        let currentPageFilename = pathSegments.pop() || 'index.html';
        currentPageFilename = currentPageFilename.replace(/\.html$/, ''); // Normalize: remove .html

        navItems.forEach(item => {
            item.classList.remove('active'); // Ensure all are inactive first

            // Find the anchor tag or use button attributes
            const link = item.tagName === 'A' ? item : item.querySelector('a');
            let itemHrefFilename = null;

            if (link && link.tagName === 'A') {
                const itemHrefFull = link.getAttribute('href');
                if (itemHrefFull && itemHrefFull !== '#') { // Ignore placeholder links
                    // Extract filename from href robustly
                    let itemHrefPath = itemHrefFull.replace(/^\/+|\/+$/g, '');
                    // Handle potential query strings or hashes if necessary
                    itemHrefPath = itemHrefPath.split('?')[0].split('#')[0];
                    const hrefSegments = itemHrefPath.split('/');
                    // Default to index.html if href is '/' or empty or refers to root
                    itemHrefFilename = (hrefSegments.pop() || 'index.html').replace(/\.html$/, ''); // Normalize: remove .html
                }
            } else if (item.dataset.page) { // Check for data-page attribute on buttons/divs
                 itemHrefFilename = (item.dataset.page || '').replace(/\.html$/, ''); // Normalize: remove .html, handle potential undefined
            }


            // Add active class if the item's href/data filename matches the current page filename
            if (itemHrefFilename && itemHrefFilename === currentPageFilename) {
                item.classList.add('active');
            }
        });
    } // End of setActiveNavItem


    // --- Dropdown Support ---
    static initDropdownSupport() {
      // Initialize all person name dropdowns already in the DOM
      this.initExistingPersonDropdowns();

      // Set up mutation observer to catch dynamically added person fields/dropdowns
      this.watchForNewDropdowns();

      // Delegate click handler for opening dropdowns to the container
      const personFieldsContainer = document.getElementById('personFields');
      if (personFieldsContainer) {
        personFieldsContainer.addEventListener('click', (e) => {
          const personNameInput = e.target.closest('.personName'); // Target the input itself
          if (personNameInput) {
              const personField = personNameInput.closest('.person-field');
              const dropdown = personField ? personField.querySelector('.name-dropdown') : null;
              if (dropdown) {
                  // Close other dropdowns first
                  document.querySelectorAll('.name-dropdown:not(.hidden)').forEach(od => {
                      if (od !== dropdown) od.classList.add('hidden');
                  });
                  // Toggle or show the clicked one
                  dropdown.classList.toggle('hidden');
                  if (!dropdown.classList.contains('hidden')) {
                      this.positionDropdown(dropdown); // Position only if showing
                  }
                  e.stopPropagation(); // Prevent document click listener from closing it immediately
              }
          }
        });
      }

      // Add document click handler to close any open dropdowns
      document.addEventListener('click', (e) => {
         // Close if the click is outside an open dropdown AND outside its corresponding trigger input
        document.querySelectorAll('.name-dropdown:not(.hidden)').forEach(dropdown => {
            const personField = dropdown.closest('.person-field');
            const personNameInput = personField ? personField.querySelector('.personName') : null;
             // If click is not inside the dropdown AND (either the input doesn't exist OR click is not inside input)
            if (!dropdown.contains(e.target) && (!personNameInput || !personNameInput.contains(e.target))) {
              dropdown.classList.add('hidden');
            }
        });
      }, true); // Use capture phase to catch clicks early
    }

    // Initialize dropdowns for elements already present
    static initExistingPersonDropdowns() {
        const personFields = document.querySelectorAll('#personFields .person-field');
        personFields.forEach(field => {
            const personNameInput = field.querySelector('.personName');
            const dropdown = field.querySelector('.name-dropdown');
            // Ensure createNameDropdown (which likely adds listeners) is called
            if (personNameInput && !dropdown && typeof Person !== 'undefined' && Person.createNameDropdown) {
                Person.createNameDropdown(personNameInput); // Let Person class handle creation/setup
            } else if(personNameInput && dropdown) {
                // Maybe ensure listeners are attached if dropdown already exists?
                // Depends on how Person.createNameDropdown works.
            }
        });
    }

    // Watch for new person fields being added
    static watchForNewDropdowns() {
      const personFieldsContainer = document.getElementById('personFields');
      if (!personFieldsContainer) return; // Need the container to observe

      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              // Check if the added node itself is a person-field or contains one
              if (node.nodeType === 1) { // Element node
                if (node.matches && node.matches('.person-field')) {
                  const personNameInput = node.querySelector('.personName');
                  if (personNameInput && typeof Person !== 'undefined' && Person.createNameDropdown) {
                     // Check if dropdown already initialized to prevent duplicates if logic allows
                     if (!node.querySelector('.name-dropdown')) {
                         Person.createNameDropdown(personNameInput);
                     }
                  }
                } else if (node.querySelectorAll) {
                  // Check if the added node contains person-fields
                  node.querySelectorAll('.person-field').forEach(field => {
                    const personNameInput = field.querySelector('.personName');
                    if (personNameInput && typeof Person !== 'undefined' && Person.createNameDropdown) {
                         if (!field.querySelector('.name-dropdown')) {
                             Person.createNameDropdown(personNameInput);
                         }
                    }
                  });
                }
              }
            });
          }
        });
      });

      // Observe the container where person fields are added
      observer.observe(personFieldsContainer, { childList: true, subtree: false }); // Observe direct children additions
    }

    // Position dropdown relative to the input field
     static positionDropdown(dropdown) {
         const personField = dropdown.closest('.person-field');
         if (!personField) return;
         const personNameInput = personField.querySelector('.personName');
         if (!personNameInput) return;

         const inputRect = personNameInput.getBoundingClientRect();

         // Reset styles first
         dropdown.style.position = 'absolute';
         dropdown.style.top = '';
         dropdown.style.left = '';
         dropdown.style.width = '';
         dropdown.style.transform = ''; // Clear potential transforms

         // Use absolute positioning relative to the personField container (assuming it's positioned non-statically)
         personField.style.position = 'relative'; // Ensure parent is a positioning context

         dropdown.style.top = `${personNameInput.offsetTop + personNameInput.offsetHeight + 2}px`; // Position below input
         dropdown.style.left = `${personNameInput.offsetLeft}px`; // Align left edges
         dropdown.style.width = `${personNameInput.offsetWidth}px`; // Match input width
         dropdown.style.zIndex = '1000'; // Ensure it's above other fields

         // Check if dropdown goes off-screen vertically and adjust
         const dropdownRect = dropdown.getBoundingClientRect();
         if (dropdownRect.bottom > window.innerHeight) {
             // Position above the input instead
             dropdown.style.top = `${personNameInput.offsetTop - dropdownRect.height - 2}px`;
         }

          // Check if dropdown goes off-screen horizontally (less likely if matching width, but good practice)
          if (dropdownRect.right > window.innerWidth) {
              dropdown.style.left = `${personNameInput.offsetLeft + personNameInput.offsetWidth - dropdownRect.width}px`; // Align right edges
          }
          if (dropdownRect.left < 0) {
               dropdown.style.left = '0px'; // Prevent going off left edge
          }

         dropdown.classList.remove('hidden'); // Ensure it's visible after positioning
     } // End of positionDropdown


    // --- Toast Notifications ---
    static showToast(message, type = 'info') {
        let container = document.getElementById('toastContainer');
        // If container doesn't exist, create and append it
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            // Position fixed, bottom-right, above potential bottom nav, with spacing
            container.className = 'fixed bottom-24 md:bottom-5 right-5 z-[10000] space-y-2 w-auto max-w-xs';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        // Base classes using Tailwind for styling
        let baseClasses = 'p-4 rounded-lg shadow-lg flex items-center text-sm transition-all duration-300 ease-in-out transform opacity-0 translate-y-2 w-full';
        let typeClasses = '';
        let iconClass = '';

        // Type-specific classes and Tabler icons
        switch (type) {
            case 'success':
                typeClasses = 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300';
                iconClass = 'ti-circle-check text-green-500';
                break;
            case 'error':
                typeClasses = 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300';
                iconClass = 'ti-alert-circle text-red-500';
                break;
            case 'warning':
                typeClasses = 'bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300';
                iconClass = 'ti-alert-triangle text-yellow-500';
                break;
            default: // info
                typeClasses = 'bg-blue-100 border border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300';
                iconClass = 'ti-info-circle text-blue-500';
        }

        toast.className = `${baseClasses} ${typeClasses}`;
        toast.innerHTML = `
            <i class="ti ${iconClass} text-xl mr-3 flex-shrink-0"></i>
            <span class="flex-grow">${Utils.escapeHTML(message)}</span>
            <button class="ml-3 -mr-1 p-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current rounded-full flex-shrink-0">
              <i class="ti ti-x text-base"></i>
            </button>
        `;

        container.prepend(toast); // Add new toasts to the top

        // Close button functionality
        const closeButton = toast.querySelector('button');
        if(closeButton){
            closeButton.addEventListener('click', () => {
                this.dismissToast(toast);
            });
        }


        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('opacity-0', 'translate-y-2');
            toast.classList.add('opacity-100', 'translate-y-0');
        });

        // Auto-dismiss after a delay
        setTimeout(() => {
            this.dismissToast(toast);
        }, 4000); // 4 seconds duration
    }

     static dismissToast(toastElement) {
         if (!toastElement || !toastElement.parentElement) return; // Already removed

         toastElement.classList.remove('opacity-100', 'translate-y-0');
         toastElement.classList.add('opacity-0', 'translate-y-2'); // Or use another exit animation

         // Remove from DOM after transition
         setTimeout(() => {
              if (toastElement.parentElement) {
                 toastElement.remove();
                 // Optional: Remove container if empty? Might cause issues if toasts appear frequently.
                 // const container = document.getElementById('toastContainer');
                 // if (container && !container.hasChildNodes()) {
                 //     container.remove();
                 // }
              }
         }, 300); // Match animation duration
     }


    // Use specific Tabler icons based on type
    static getToastIcon(type) { // Kept for potential direct use, but embedded in showToast now
      switch (type) {
        case 'success': return 'circle-check';
        case 'error': return 'alert-circle';
        case 'warning': return 'alert-triangle';
        default: return 'info-circle';
      }
    }

    // --- Settings Modal ---
     static openSettingsModal() {
         let modal = document.getElementById('settingsModal');

         // If modal doesn't exist, create it
         if (!modal) {
             modal = document.createElement('div');
             modal.id = 'settingsModal';
             modal.className = 'fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-[5000] flex items-center justify-center p-4 hidden'; // Start hidden, added padding
             modal.setAttribute('role', 'dialog');
             modal.setAttribute('aria-modal', 'true');
             modal.setAttribute('aria-labelledby', 'settingsModalTitle');

             modal.innerHTML = `
                 <div class="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 ease-out scale-95 opacity-0" role="document">
                     <!-- Header -->
                     <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
                         <h3 id="settingsModalTitle" class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                             <i class="ti ti-settings text-xl mr-2"></i>Settings
                         </h3>
                         <button onclick="UI.closeSettings()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-purple dark:focus:ring-offset-dark-card" aria-label="Close settings">
                             <i class="ti ti-x text-xl"></i>
                         </button>
                     </div>

                     <!-- Body -->
                     <div class="p-5 space-y-6">
                         <!-- Theme Toggle -->
                         <div class="flex items-center justify-between">
                             <label for="darkModeToggle" class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center cursor-pointer">
                                 <i class="ti ti-moon mr-2"></i> Dark Mode
                             </label>
                             <label class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" id="darkModeToggle" class="sr-only peer" ${document.documentElement.classList.contains('dark') ? 'checked' : ''}>
                                 <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-accent-purple rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent-purple"></div>
                             </label>
                         </div>

                         <!-- Currency Select -->
                         <div>
                             <label for="currencySelect" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                 <i class="ti ti-currency-dollar mr-2"></i> Currency
                             </label>
                             <select id="currencySelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-dark-input dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-accent-purple focus:border-accent-purple">
                                 <option value="USD">USD ($)</option>
                                 <option value="SGD">SGD (S$)</option> <!-- Added SGD -->
                                 <option value="EUR">EUR (€)</option>
                                 <option value="GBP">GBP (£)</option>
                                 <option value="JPY">JPY (¥)</option>
                                 <option value="CAD">CAD ($)</option>
                                 <option value="AUD">AUD ($)</option> <!-- Added AUD -->
                             </select>
                         </div>

                         <!-- Budget Settings -->
                         <div>
                             <label for="monthlyBudget" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                 <i class="ti ti-calendar-stats mr-2"></i> Monthly Budget Goal (Optional)
                             </label>
                              <div class="relative">
                                 <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 pointer-events-none" id="budgetCurrencySymbol">$</span>
                                 <input type="number" id="monthlyBudget" placeholder="Enter amount" min="0" step="any" class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg dark:bg-dark-input dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-accent-purple focus:border-accent-purple" value="${localStorage.getItem('monthlyBudget') || ''}" aria-describedby="budgetCurrencySymbol">
                             </div>
                         </div>

                         <!-- Data Management -->
                         <div>
                             <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                 <i class="ti ti-database-cog mr-2"></i> Data Management
                             </label>
                             <button id="clearHistoryBtn" class="w-full btn btn-danger flex items-center justify-center">
                                 <i class="ti ti-trash mr-2"></i> Clear All History
                             </button>
                             <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Permanently removes all saved bill history.</p>
                         </div>
                     </div>

                     <!-- Footer -->
                     <div class="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
                         <button onclick="UI.closeSettings()" class="btn btn-secondary">
                             Cancel
                         </button>
                         <button onclick="UI.saveSettings()" class="btn btn-primary">
                             Save Settings
                         </button>
                     </div>
                 </div>
             `;

             document.body.appendChild(modal);

             // --- Add Event Listeners After Creation ---
             // Dark Mode Toggle
             const darkModeToggle = modal.querySelector('#darkModeToggle');
             if (darkModeToggle) {
                 darkModeToggle.addEventListener('change', function() {
                     const isDark = document.documentElement.classList.toggle('dark');
                     localStorage.setItem('theme', isDark ? 'dark' : 'light');
                 });
             }

             // Currency Select
             const currencySelect = modal.querySelector('#currencySelect');
             if (currencySelect) {
                 const savedCurrency = localStorage.getItem('currency') || 'SGD'; // Default to SGD
                 currencySelect.value = savedCurrency;
                 // Update budget symbol on initial load and on change
                 this.updateBudgetCurrencySymbol(savedCurrency);
                  currencySelect.addEventListener('change', function() {
                     // Currency is saved only when 'Save Settings' is clicked
                      UI.updateBudgetCurrencySymbol(this.value);
                 });
             }

             // Budget Input
             const budgetInput = modal.querySelector('#monthlyBudget');
             if (budgetInput) {
                 // No listener needed here, value saved on clicking "Save Settings"
             }

             // Clear History Button
             const clearHistoryBtn = modal.querySelector('#clearHistoryBtn');
             if (clearHistoryBtn && typeof History !== 'undefined' && History.clearAllHistory) {
                 clearHistoryBtn.addEventListener('click', () => {
                      // Use a more visually distinct confirmation
                     if (confirm('⚠️ Are you absolutely sure?\n\nClearing history will permanently delete all saved bills and cannot be undone.')) {
                         History.clearAllHistory();
                         UI.showToast('Bill history cleared.', 'warning');
                         // Maybe update stats page if open?
                         if(typeof Statistics !== 'undefined' && Statistics.loadStatistics) {
                             Statistics.loadStatistics();
                         }
                         // UI.closeSettings(); // Optional: keep settings open
                     }
                 });
             }

             // Trap focus inside modal
              this.trapFocus(modal);


         } // End if (!modal)

         // Show the modal with animation
         modal.classList.remove('hidden');
         // Allow the browser to paint the modal before starting animation
         requestAnimationFrame(() => {
             const modalBox = modal.querySelector('.w-full.max-w-md');
             if (modalBox) {
                 modalBox.classList.remove('scale-95', 'opacity-0');
                 modalBox.classList.add('scale-100', 'opacity-100');
                  // Focus the first focusable element (e.g., the close button)
                 const focusableElements = modalBox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                 if (focusableElements.length) {
                    // Find first focusable element that is not the toggle switch (for better initial UX)
                    const firstButton = Array.from(focusableElements).find(el => el.tagName === 'BUTTON' && !el.closest('label'));
                    if (firstButton) {
                        firstButton.focus();
                    } else if (focusableElements[0]) {
                        focusableElements[0].focus(); // Fallback to the very first if no suitable button found
                    }
                 }
             }
         });
     } // End of openSettingsModal

      // Helper function to update currency symbol next to budget input
      static updateBudgetCurrencySymbol(currencyCode) {
         const symbolSpan = document.getElementById('budgetCurrencySymbol');
         if (symbolSpan) {
             symbolSpan.textContent = this.getCurrencySymbol(currencyCode);
         }
      }

      // Simple currency symbol lookup (expand as needed)
      static getCurrencySymbol(currencyCode) {
         const symbols = {
             'USD': '$', 'SGD': 'S$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': '$', 'AUD': '$'
             // Add more currencies as supported
         };
         return symbols[currencyCode] || '$'; // Default to $
      }


     static closeSettings() {
         const modal = document.getElementById('settingsModal');
         if (modal) {
             const modalBox = modal.querySelector('.w-full.max-w-md');
             if (modalBox) {
                 modalBox.classList.remove('scale-100', 'opacity-100');
                 modalBox.classList.add('scale-95', 'opacity-0');
             }

             // Wait for animation to finish before hiding
             setTimeout(() => {
                 modal.classList.add('hidden');
             }, 300); // Match animation duration (duration-300)
         }
     } // End of closeSettings

     static saveSettings() {
         // Save currency
         const currencySelect = document.getElementById('currencySelect');
         let savedCurrency = 'SGD'; // Default
         if (currencySelect) {
             savedCurrency = currencySelect.value;
             localStorage.setItem('currency', savedCurrency);
         }

         // Save budget
         const budgetInput = document.getElementById('monthlyBudget');
         if (budgetInput) {
             const budgetValue = budgetInput.value.trim();
             if (budgetValue && !isNaN(budgetValue) && parseFloat(budgetValue) >= 0) {
                 localStorage.setItem('monthlyBudget', parseFloat(budgetValue));
             } else {
                 localStorage.removeItem('monthlyBudget');
                 budgetInput.value = ''; // Clear invalid input on save
             }
         }

         this.showToast('Settings saved successfully!', 'success');
         this.closeSettings();

         // Trigger UI updates based on new settings
         this.updateUICurrency(savedCurrency);
         if (typeof Statistics !== 'undefined' && Statistics.loadStatistics) {
             Statistics.loadStatistics(); // Reload stats to reflect new budget/currency
         }
          // Update currency display on main page elements if applicable
         if (typeof Calculator !== 'undefined' && Calculator.updateCurrencyDisplays) {
            Calculator.updateCurrencyDisplays();
         }

     } // End of saveSettings

     // Method to update currency symbols across the UI
     static updateUICurrency(currencyCode) {
         const symbol = this.getCurrencySymbol(currencyCode);
         // Update all elements that display currency
         document.querySelectorAll('.currency-symbol').forEach(span => {
             span.textContent = symbol;
         });
          // Update budget currency symbol specifically
         this.updateBudgetCurrencySymbol(currencyCode);

         // Update placeholders maybe?
          document.querySelectorAll('input[placeholder*="$"], input[placeholder*="S$"], input[placeholder*="€"], input[placeholder*="£"], input[placeholder*="¥"]').forEach(input => {
             // More robust placeholder update
             const placeholder = input.getAttribute('placeholder') || '';
             // Match common currency patterns at the start or after a space
             input.placeholder = placeholder.replace(/^([$]|S[$]|€|£|¥)\s*/, `${symbol} `)
                                             .replace(/([(]([$]|S[$]|€|£|¥)[)])/, `(${symbol})`);
         });
          // Example: Update total display if it exists outside calculator scope
          const totalAmountDisplay = document.getElementById('totalAmountDisplay'); // Example ID
          if(totalAmountDisplay && typeof Calculator !== 'undefined' && Calculator.formatCurrency) {
             // Re-fetch or reformat the value with the new symbol
             // This assumes the total amount is stored somewhere accessible or needs re-calculation
             // For demonstration, let's assume it has a numeric value stored
             const numericValue = parseFloat(totalAmountDisplay.dataset.numericValue || '0');
             totalAmountDisplay.textContent = Calculator.formatCurrency(numericValue);
          }
     }

     // Helper for focus trapping in modal
     static trapFocus(element) {
         const focusableEls = element.querySelectorAll(
             'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), input[type="number"]:not([disabled]), select:not([disabled])'
         );
         if (focusableEls.length === 0) return; // No focusable elements

         const firstFocusableEl = focusableEls[0];
         const lastFocusableEl = focusableEls[focusableEls.length - 1];

         element.addEventListener('keydown', function(e) {
             const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

             if (!isTabPressed) {
                 return;
             }

             if (e.shiftKey) /* shift + tab */ {
                 if (document.activeElement === firstFocusableEl) {
                     lastFocusableEl.focus();
                     e.preventDefault();
                 }
             } else /* tab */ {
                 if (document.activeElement === lastFocusableEl) {
                     firstFocusableEl.focus();
                     e.preventDefault();
                 }
             }
         });
     }


     // --- Bottom Nav Creation (Fallback) ---
     static createBottomNavIfMissing() {
         // Check if navigation exists
         if (!document.querySelector('.bottom-navigation')) {
             console.log('Creating missing bottom navigation');

             const navElement = document.createElement('div');
             // Use Tailwind classes for styling - ensure these match your design
             navElement.className = 'bottom-navigation fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-dark-card backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] rounded-t-3xl shadow-top z-50 flex'; // Added safe area padding for iOS
             navElement.id = 'bottomNavigation'; // Keep ID if referenced elsewhere

             // Inner structure
             navElement.innerHTML = `
                 <div class="max-w-lg mx-auto flex justify-around items-center w-full px-2">
                     <a href="index.html" class="nav-item flex flex-col items-center px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200 rounded-lg" data-page="index.html">
                         <i class="ti ti-home text-2xl"></i>
                         <span class="text-xs mt-1 font-medium">Home</span>
                     </a>
                     <a href="statistics.html" class="nav-item flex flex-col items-center px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200 rounded-lg" data-page="statistics.html">
                         <i class="ti ti-chart-bar text-2xl"></i>
                         <span class="text-xs mt-1 font-medium">Stats</span>
                     </a>
                     <div class="relative flex justify-center items-center flex-shrink-0 mx-2"> <!-- Center button container -->
                         <button id="addButton" class="nav-item-center bg-accent-purple hover:bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 active:scale-95 relative overflow-hidden -mt-8 border-4 border-white dark:border-dark-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-purple dark:focus:ring-offset-dark-bg" aria-label="Scan Invoice" data-page="scan"> <!-- Added data-page for potential active state -->
                             <i class="ti ti-scan text-3xl"></i>
                         </button>
                     </div>
                     <button id="historyBtnNav" class="nav-item flex flex-col items-center px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200 rounded-lg" aria-label="View History" data-page="history"> <!-- Added data-page for potential active state -->
                         <i class="ti ti-history text-2xl"></i>
                         <span class="text-xs mt-1 font-medium">History</span>
                     </button>
                     <button id="settingsBtn" class="nav-item flex flex-col items-center px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-accent-purple dark:hover:text-accent-purple transition-colors duration-200 rounded-lg" aria-label="Open Settings" data-page="settings"> <!-- Added data-page for potential active state -->
                         <i class="ti ti-settings text-2xl"></i>
                         <span class="text-xs mt-1 font-medium">Settings</span>
                     </button>
                 </div>
             `;

             // Append to body
             document.body.appendChild(navElement);

             // Initialize its behavior AFTER appending and ensuring it's in the DOM
             requestAnimationFrame(() => {
                 this.initFancyBottomNav(); // Initialize buttons within the newly created nav
                 this.setActiveNavItem();   // Set active state for the newly created nav
             });

         } // End if (!document.querySelector...)
     } // End of createBottomNavIfMissing


  } // ========= End of UI Class =========


  // --- Global Initialization ---

  // Apply theme instantly based on localStorage/system preference before DOM ready (reduces flicker)
  (() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
       document.documentElement.classList.add('dark');
    } else {
       document.documentElement.classList.remove('dark');
    }
  })();


  // Initialize UI when document is ready
  document.addEventListener('DOMContentLoaded', () => {
      // Initialize core UI features, including nav check/creation and other setups
      UI.init();

      // Note: The setTimeout logic previously here was removed.
      // UI.init() now handles checking/creating the nav and initializing other components like dropdowns and currency.
  });