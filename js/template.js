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
      
      // Set person name
      personField.querySelector("h3").textContent = person.name;
      
      // Remove default empty item
      const foodList = personField.querySelector(".person-food-list");
      foodList.innerHTML = '';
      
      // Add items if they exist
      if (person.items && person.items.length > 0) {
        for (const item of person.items) {
          const foodItem = document.createElement("li");
          foodItem.className = "flex items-center gap-2";
          foodItem.innerHTML = `
            <input type="text" class="food-price flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              placeholder="Price" oninput="Utils.handleCalculatorInput(this)" value="${item.price || ''}">
            <button type="button" onclick="Person.removeFoodItem(this)" class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>`;
          foodList.appendChild(foodItem);
        }
      }
      
      // Add an empty item for new entries
      const emptyItem = document.createElement("li");
      emptyItem.className = "flex items-center gap-2";
      emptyItem.innerHTML = `
        <input type="text" class="food-price flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
          placeholder="Price" oninput="Utils.handleCalculatorInput(this)">
        <button type="button" onclick="Person.addFoodItem(this)" class="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>`;
      foodList.appendChild(emptyItem);
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