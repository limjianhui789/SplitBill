// Template management functionality for SplitInvoice

const Template = {
  // Open template modal
  openTemplateModal: function() {
    const modal = document.getElementById('templateModal');
    modal.classList.remove('hidden');

    // Load saved groups
    this.loadSavedGroups();

    // Load saved templates
    this.loadSavedTemplates();
  },

  // Close template modal
  closeTemplateModal: function() {
    document.getElementById('templateModal').classList.add('hidden');
  },

  // Load saved groups
  loadSavedGroups: function() {
    const groupsList = document.getElementById('savedGroupsList');
    groupsList.innerHTML = '';

    // Get saved groups
    const groups = JSON.parse(localStorage.getItem('savedGroups')) || [];

    if (groups.length === 0) {
      groupsList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No saved groups found.</div>';
      return;
    }

    // Create group buttons
    for (const group of groups) {
      const groupBtn = document.createElement('button');
      groupBtn.className = 'p-3 bg-white dark:bg-gray-700 rounded-lg shadow text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200';
      groupBtn.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-800 dark:text-white">${group.name}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">${group.people.length} people</span>
        </div>
      `;

      groupBtn.addEventListener('click', function() {
        Group.loadGroup(group.id);
      });

      groupsList.appendChild(groupBtn);
    }
  },

  // Load saved templates
  loadSavedTemplates: function() {
    const templatesList = document.getElementById('savedTemplatesList');
    templatesList.innerHTML = '';

    // Get saved templates
    const templates = JSON.parse(localStorage.getItem('savedTemplates')) || [];

    if (templates.length === 0) {
      templatesList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No saved templates found.</div>';
      return;
    }

    // Create template items
    for (const template of templates) {
      const templateItem = document.createElement('div');
      templateItem.className = 'bg-white dark:bg-gray-700 rounded-lg p-3 shadow';
      templateItem.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h4 class="font-medium text-gray-800 dark:text-white">${template.name}</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              ${template.restaurant ? template.restaurant : 'No restaurant'} •
              ${template.people.length} people
            </p>
          </div>
          <div class="flex gap-2">
            <button class="load-template-btn p-2 text-primary-500 hover:text-primary-700" data-template-id="${template.id}">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button class="delete-template-btn p-2 text-red-500 hover:text-red-700" data-template-id="${template.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      templatesList.appendChild(templateItem);
    }

    // Add event listeners
    document.querySelectorAll('.load-template-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const templateId = this.dataset.templateId;
        Template.loadTemplate(templateId);
        Template.closeTemplateModal();
      });
    });

    document.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const templateId = this.dataset.templateId;
        Template.deleteTemplate(templateId);
        Template.loadSavedTemplates(); // Refresh the templates list
      });
    });
  },

  // Load a template
  loadTemplate: function(templateId) {
    const templates = JSON.parse(localStorage.getItem('savedTemplates')) || [];
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      Utils.showToast('Template not found', 'error');
      return;
    }

    // Set restaurant and location
    document.getElementById('restaurantInput').value = template.restaurant || '';
    document.getElementById('locationInput').value = template.location || '';

    // Set tax and additional fee
    document.getElementById('taxInput').value = template.taxPercentage || '';
    document.getElementById('additionalFeeInput').value = template.additionalFee || '';

    // Set notes
    document.getElementById('notesInput').value = template.notes || '';

    // Clear existing people
    document.getElementById('personFields').innerHTML = '';

    // Add people from template
    for (const person of template.people) {
      Person.addPersonField();

      // Get the last added person field
      const personFields = document.getElementsByClassName("person-field");
      const personField = personFields[personFields.length - 1];

      // Set person name if personField exists
      if (personField) {
        const nameElement = personField.querySelector(".personName h3");
        if (nameElement) {
          nameElement.textContent = person.name;
        } else {
          console.warn(`Could not find name element for person: ${person.name}`);
        }

        // Remove default empty item
        let foodList = personField.querySelector(".person-food-list");
        if (foodList) {
          foodList.innerHTML = '';
        } else {
          console.warn(`Could not find food list for person: ${person.name}`);
          // Create food list if it doesn't exist
          const newFoodList = document.createElement('ul');
          newFoodList.className = 'person-food-list space-y-2 sm:space-y-3';
          personField.appendChild(newFoodList);
          foodList = newFoodList;
        }
      } else {
        console.error(`Could not find person field for: ${person.name}`);
        continue; // Skip to the next person
      }

      // Add items if they exist and foodList exists
      let foodListElement = personField?.querySelector(".person-food-list");
      if (foodListElement && person.items && person.items.length > 0) {
        for (const item of person.items) {
          const foodItem = document.createElement("li");
          foodItem.className = "food-item-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3";
          foodItem.innerHTML = `
            <input type="text" class="food-item-name flex-grow px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
              placeholder="Item Name" value="${item.description || ''}">
            <input type="text" class="food-price w-full sm:w-28 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
              placeholder="Price" inputmode="decimal" oninput="Utils.handleCalculatorInput(this)" value="${item.price || ''}">
            <!-- Button Wrapper -->
            <div class="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
              <button type="button" onclick="Person.removeFoodItem(this)" class="remove-food-btn p-1.5 sm:p-2 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 ease-in-out">
                <i class="ti ti-minus text-lg sm:text-xl"></i>
              </button>
              <button type="button" onclick="Person.addFoodItem(this)" class="add-food-btn p-1.5 sm:p-2 rounded-full text-accent-blue hover:text-blue-700 dark:text-accent-blue dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue transition-colors duration-200 ease-in-out">
                <i class="ti ti-plus text-lg sm:text-xl"></i>
              </button>
            </div>`;
          foodListElement.appendChild(foodItem);
        }
      }

      // Add an empty item for new entries if foodListElement exists
      if (foodListElement) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "food-item-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3";
        emptyItem.innerHTML = `
          <input type="text" class="food-item-name flex-grow px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
            placeholder="Item Name">
          <input type="text" class="food-price w-full sm:w-28 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
            placeholder="Price" inputmode="decimal" oninput="Utils.handleCalculatorInput(this)">
          <!-- Button Wrapper -->
          <div class="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
            <button type="button" onclick="Person.removeFoodItem(this)" class="remove-food-btn p-1.5 sm:p-2 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 ease-in-out" style="display: none;">
              <i class="ti ti-minus text-lg sm:text-xl"></i>
            </button>
            <button type="button" onclick="Person.addFoodItem(this)" class="add-food-btn p-1.5 sm:p-2 rounded-full text-accent-blue hover:text-blue-700 dark:text-accent-blue dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue transition-colors duration-200 ease-in-out">
              <i class="ti ti-plus text-lg sm:text-xl"></i>
            </button>
          </div>`;
        foodListElement.appendChild(emptyItem);
      }
    }

    Utils.showToast('Template loaded successfully!', 'success');
  },

  // Delete a template
  deleteTemplate: function(templateId) {
    let templates = JSON.parse(localStorage.getItem('savedTemplates')) || [];
    templates = templates.filter(template => template.id !== templateId);
    localStorage.setItem('savedTemplates', JSON.stringify(templates));

    Utils.showToast('Template deleted successfully!', 'success');
  },

  // Save the current bill as a template
  saveAsTemplate: function() {
    const templateName = prompt('Enter a name for this template:');

    if (!templateName) {
      return;
    }

    // Get current bill data
    const restaurant = document.getElementById('restaurantInput').value;
    const location = document.getElementById('locationInput').value;
    const taxPercentage = parseFloat(document.getElementById('taxInput').value) || 0;
    const additionalFee = parseFloat(document.getElementById('additionalFeeInput').value) || 0;
    const notes = document.getElementById('notesInput').value || '';

    // Get people data
    const people = [];
    const personFields = document.getElementsByClassName("person-field");

    for (let i = 0; i < personFields.length; i++) {
      const personField = personFields[i];
      const personName = personField.querySelector("h3").textContent;
      const items = [];

      const priceInputs = personField.querySelectorAll(".food-price");
      for (let j = 0; j < priceInputs.length; j++) {
        const price = parseFloat(priceInputs[j].value);
        if (!isNaN(price)) {
          items.push({
            price: price,
            description: `Item ${j + 1}`
          });
        }
      }

      people.push({
        name: personName,
        items: items
      });
    }

    // Create template object
    const template = {
      id: Date.now().toString(),
      name: templateName,
      restaurant: restaurant,
      location: location,
      taxPercentage: taxPercentage,
      additionalFee: additionalFee,
      notes: notes,
      people: people
    };

    // Get existing templates
    let templates = JSON.parse(localStorage.getItem('savedTemplates')) || [];
    templates.push(template);

    // Save updated templates
    localStorage.setItem('savedTemplates', JSON.stringify(templates));

    Utils.showToast('Template saved successfully!', 'success');
  }
};