// Person-related functionality for SplitInvoice

const Person = {
  // Storage key for saved names
  NAME_STORAGE_KEY: 'savedNames',

  // Get saved names from local storage
  getSavedNames: function() {
    const names = localStorage.getItem(this.NAME_STORAGE_KEY);
    return names ? JSON.parse(names) : ['Person 1', 'Person 2', 'Person 3'];
  },

  // Save a name to local storage
  saveName: function(name) {
    const names = this.getSavedNames();
    if (!names.includes(name)) {
      names.push(name);
      localStorage.setItem(this.NAME_STORAGE_KEY, JSON.stringify(names));
    }
  },

  // Remove a name from local storage
  removeName: function(name) {
    const names = this.getSavedNames().filter(n => n !== name);
    localStorage.setItem(this.NAME_STORAGE_KEY, JSON.stringify(names));
  },

  // Add a new person field to the form with animation
  addPersonField: function() {
    const personFieldsContainer = document.getElementById("personFields");
    const personCount = personFieldsContainer.children.length;

    const newPersonField = document.createElement("div");
    newPersonField.classList.add("person-field", "bg-white", "dark:bg-dark-card", "p-4", "rounded-xl", "shadow-sm", "border", "border-gray-100", "dark:border-gray-800", "hover:scale-105", "transition-transform", "opacity-0");
    newPersonField.innerHTML = `
      <div class="relative">
        <div class="personName text-lg font-semibold text-center mb-3 text-gray-700 dark:text-white cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded dropdown-toggle">
          <h3 contenteditable="true" class="outline-none">Person ${personCount + 1}</h3>
        </div>
        <div class="name-dropdown hidden absolute z-10 w-full mt-1 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div class="p-2">
            <input type="text" class="new-name-input w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white mb-2" placeholder="Add new name">
            <div class="flex gap-2">
              <button class="add-name-btn btn btn-success flex-1">Save Name</button>
              <button class="add-temp-name-btn btn btn-secondary flex-1">Use Once</button>
            </div>
          </div>
          <div class="saved-names-list max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700"></div>
        </div>
      </div>
      <ul class="person-food-list space-y-2">
        <li class="flex items-center gap-2">
          <input type="text" class="food-price flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent" placeholder="Price" oninput="Utils.handleCalculatorInput(this)">
          <button type="button" onclick="Person.addFoodItem(this)" class="p-2 text-accent-blue hover:text-blue-700 dark:text-accent-blue dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </li>
      </ul>
      <button type="button" onclick="Person.removePersonField(this)" class="mt-2 w-full btn btn-secondary text-white">
        <i class="fas fa-user-minus mr-1"></i>
        <span>Remove Person</span>
      </button>`;

    personFieldsContainer.appendChild(newPersonField);

    // Trigger animation after append
    setTimeout(() => {
      newPersonField.classList.add('animate-fade-in-up');
      newPersonField.classList.remove('opacity-0');
    }, 10);

    // Get and initialize the dropdown
    const personNameElement = newPersonField.querySelector('.personName');
    if (personNameElement) {
      // Set initial display before we create the dropdown
      personNameElement.addEventListener('click', function(e) {
        const dropdown = personNameElement.parentElement.querySelector('.name-dropdown');
        if (dropdown) {
          dropdown.classList.remove('hidden');
        }
      });
      
      // Initialize dropdown functionality
      this.createNameDropdown(personNameElement);
    }
    
    // Update person labels
    this.updatePersonLabels();
    
    // Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    // Show toast notification
    Utils.showToast('Person added', 'success');
  },

  // Remove a person field from the form with animation
  removePersonField: function(button) {
    const personField = button.closest('.person-field');
    
    // Only allow removal if there's more than one person
    const personFieldsContainer = document.getElementById("personFields");
    if (personFieldsContainer.children.length <= 1) {
      Utils.showToast('Cannot remove last person', 'error');
      return;
    }
    
    // Add exit animation
    personField.classList.add('animate-fade-out');
    personField.style.opacity = '0';
    personField.style.height = '0';
    personField.style.margin = '0';
    personField.style.padding = '0';
    personField.style.overflow = 'hidden';
    
    // Remove after animation
    setTimeout(() => {
      personField.remove();
      this.updatePersonLabels();
    }, 300);
    
    // Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([50, 50, 50]);
    }
    
    // Show toast notification
    Utils.showToast('Person removed', 'info');
  },

  // Add a food item to a person's food list with animation
  addFoodItem: function(button) {
    const foodList = button.closest('.person-food-list');
    const newFoodItem = document.createElement("li");
    newFoodItem.classList.add("flex", "items-center", "gap-2", "opacity-0");
    newFoodItem.innerHTML = `
      <input type="text" class="food-price flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent" placeholder="Price" oninput="Utils.handleCalculatorInput(this)">
      <button type="button" onclick="Person.removeFoodItem(this)" class="p-2 text-accent-red hover:text-red-700 dark:text-accent-red dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>`;
    foodList.appendChild(newFoodItem);
    
    // Focus the new input
    const input = newFoodItem.querySelector('input');
    
    // Trigger animation after append
    setTimeout(() => {
      newFoodItem.classList.add('animate-fade-in-up');
      newFoodItem.classList.remove('opacity-0');
      input.focus();
    }, 10);
    
    // Add subtle haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }
  },

  // Remove a food item from a person's food list with animation
  removeFoodItem: function(button) {
    const foodItem = button.closest('li');
    
    // Check if this is the last food item
    const foodList = foodItem.parentNode;
    if (foodList.children.length <= 1) {
      Utils.showToast('Cannot remove last food item', 'error');
      return;
    }
    
    // Add exit animation
    foodItem.classList.add('animate-fade-out');
    foodItem.style.opacity = '0';
    foodItem.style.height = '0';
    foodItem.style.margin = '0';
    foodItem.style.padding = '0';
    foodItem.style.overflow = 'hidden';
    
    // Remove after animation
    setTimeout(() => {
      foodItem.remove();
      
      // Auto-calculate if enabled
      if (localStorage.getItem('autoCalculate') === 'true') {
        Calculator.calculate();
      }
    }, 300);
    
    // Add subtle haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([25, 25]);
    }
  },

  // Update person labels after adding/removing a person
  updatePersonLabels: function() {
    const personFields = document.querySelectorAll(".person-field");
    
    personFields.forEach((personField, index) => {
      const personLabel = personField.querySelector("h3[contenteditable='true']");
      if (personLabel && personLabel.textContent.startsWith("Person ")) {
        personLabel.textContent = `Person ${index + 1}`;
      }
    });
  },

  // Create name dropdown for a person name element
  createNameDropdown: function(personNameElement) {
    // If already initialized, skip
    if (personNameElement.dataset.dropdownInitialized === 'true') {
      return;
    }
    
    const dropdown = personNameElement.parentElement.querySelector('.name-dropdown');
    if (!dropdown) {
      console.error('Could not find dropdown element for', personNameElement);
      return;
    }
    
    const namesList = dropdown.querySelector('.saved-names-list');
    const newNameInput = dropdown.querySelector('.new-name-input');
    const addNameBtn = dropdown.querySelector('.add-name-btn');
    const addTempNameBtn = dropdown.querySelector('.add-temp-name-btn');
    const h3Element = personNameElement.querySelector('h3');
    
    if (!h3Element || !namesList || !newNameInput || !addNameBtn || !addTempNameBtn) {
      console.error('Missing required elements for personName dropdown', personNameElement);
      return;
    }

    // Mark as initialized
    personNameElement.dataset.dropdownInitialized = 'true';
    
    // Add a click handler directly to this dropdown toggle
    personNameElement.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent bubbling
      
      // If dropdown is already open, don't do anything (let the document click handler close it)
      if (!dropdown.classList.contains('hidden')) {
        return;
      }
      
      // Close all other open dropdowns first
      document.querySelectorAll('.name-dropdown:not(.hidden)').forEach(d => {
        if (d !== dropdown) {
          d.classList.add('hidden');
        }
      });
      
      // Update the names list before showing
      updateNamesList();
      
      // Show this dropdown
      dropdown.classList.remove('hidden');
      
      // Select all text in the name
      Utils.selectAllText(h3Element);
      
      // Add entrance animation
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0)';
        dropdown.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      }, 10);
    });

    // Update names list
    function updateNamesList() {
      namesList.innerHTML = '';
      Person.getSavedNames().forEach(name => {
        const nameItem = document.createElement('div');
        nameItem.className = 'flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        nameItem.dataset.name = name;
        nameItem.innerHTML = `
          <span class="name-option text-gray-800 dark:text-gray-200">${name}</span>
          <button class="delete-name text-accent-red hover:text-red-700 dark:text-accent-red dark:hover:text-red-400">&times;</button>
        `;
        namesList.appendChild(nameItem);
      });
    }

    // Click on dropdown option
    namesList.addEventListener('click', (e) => {
      const nameItem = e.target.closest('.flex');
      if (!nameItem) return;

      if (e.target.classList.contains('delete-name')) {
        const nameToDelete = nameItem.dataset.name;
        Person.removeName(nameToDelete);
        updateNamesList();
      } else if (!e.target.classList.contains('delete-name')) {
        h3Element.textContent = nameItem.dataset.name;
        dropdown.classList.add('hidden');
      }
      
      // Prevent event bubbling
      e.stopPropagation();
    });

    // Add new name
    addNameBtn.addEventListener('click', (e) => {
      const newName = newNameInput.value.trim();
      if (newName) {
        Person.saveName(newName);
        h3Element.textContent = newName;
        updateNamesList();
        newNameInput.value = '';
        dropdown.classList.add('hidden');
        
        // Show toast notification
        Utils.showToast(`Name "${newName}" saved`, 'success');
      }
      
      // Prevent event bubbling
      e.stopPropagation();
    });

    // Add temporary name
    addTempNameBtn.addEventListener('click', (e) => {
      const newName = newNameInput.value.trim();
      if (newName) {
        h3Element.textContent = newName;
        dropdown.classList.add('hidden');
        newNameInput.value = '';
      }
      
      // Prevent event bubbling
      e.stopPropagation();
    });

    // Enter key in input
    newNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addNameBtn.click();
        // Prevent default behavior
        e.preventDefault();
      }
    });

    // Prevent clicks inside dropdown from closing it
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}; 