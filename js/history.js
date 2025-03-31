// Bill history functionality for SplitInvoice

const History = {
  // Open history modal
  openHistoryModal: function() {
    // Open the history modal
    const modal = document.getElementById('historyModal');
    modal.classList.remove('hidden');
    
    // Load bill history
    this.loadBillHistory();
  },

  // Close history modal
  closeHistoryModal: function() {
    document.getElementById('historyModal').classList.add('hidden');
  },

  // Load bill history
  loadBillHistory: function() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    // Get saved bills
    const bills = JSON.parse(localStorage.getItem('savedBills')) || [];
    
    if (bills.length === 0) {
      historyList.innerHTML = `
        <div class="p-8 text-center">
          <i class="fas fa-history text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500 dark:text-gray-400">No saved bills found.</p>
        </div>`;
      return;
    }
    
    // Sort bills by date (most recent first)
    bills.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create bill history items
    for (const bill of bills) {
      const billDate = new Date(bill.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Get totalAmount
      let totalAmount = bill.totalAmount || 0;
      
      const billItem = document.createElement('div');
      billItem.className = 'bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 border border-gray-100 dark:border-gray-700';
      billItem.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <i class="fas fa-utensils text-primary-500"></i>
              ${bill.restaurant}
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <i class="fas fa-map-marker-alt mr-1"></i>${bill.location}
            </p>
            <div class="history-meta-info">
              <span class="history-meta-tag">
                <i class="fas fa-users"></i>
                ${bill.people.length} people
              </span>
              <span class="history-meta-tag">
                <i class="fas fa-calendar-alt"></i>
                ${billDate}
              </span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-gray-900 dark:text-white">${Utils.formatCurrency(totalAmount)}</p>
            <div class="mt-2 flex gap-2">
              <button class="load-bill-btn px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm" data-bill-id="${bill.id}">
                <i class="fas fa-sync-alt mr-1"></i> Load
              </button>
              <button class="delete-bill-btn px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm" data-bill-id="${bill.id}">
                <i class="fas fa-trash mr-1"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      
      historyList.appendChild(billItem);
    }
    
    // Add event listeners for load and delete buttons
    document.querySelectorAll('.load-bill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const billId = this.dataset.billId;
        History.loadBill(billId);
        History.closeHistoryModal();
      });
    });
    
    document.querySelectorAll('.delete-bill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const billId = this.dataset.billId;
        History.deleteBill(billId);
        History.loadBillHistory(); // Refresh the history list
      });
    });
  },

  // Load a bill from history
  loadBill: function(billId) {
    const bills = JSON.parse(localStorage.getItem('savedBills')) || [];
    const bill = bills.find(b => b.id === billId);
    
    if (!bill) {
      Utils.showToast('Bill not found', 'error');
      return;
    }
    
    // Clear existing people
    document.getElementById('personFields').innerHTML = '';
    
    // Set restaurant and location
    document.getElementById('restaurantInput').value = bill.restaurant;
    document.getElementById('locationInput').value = bill.location;
    
    // Set tax and additional fee
    document.getElementById('taxInput').value = bill.taxPercentage;
    document.getElementById('additionalFeeInput').value = bill.additionalFee;
    
    // Set notes
    document.getElementById('notesInput').value = bill.notes || '';
    
    // Add people
    for (const person of bill.people) {
      Person.addPersonField();
      
      // Get the last added person field
      const personFields = document.getElementsByClassName("person-field");
      const personField = personFields[personFields.length - 1];
      
      // Set person name
      personField.querySelector("h3").textContent = person.name;
      
      // Remove default empty item
      const foodList = personField.querySelector(".person-food-list");
      foodList.innerHTML = '';
      
      // Add items
      for (const item of person.items) {
        const foodItem = document.createElement("li");
        foodItem.className = "flex items-center gap-2";
        foodItem.innerHTML = `
          <input type="text" class="food-price flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
            placeholder="Price" oninput="Utils.handleCalculatorInput(this)" value="${item.price}">
          <button type="button" onclick="Person.removeFoodItem(this)" class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>`;
        foodList.appendChild(foodItem);
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
    
    // Calculate and show results
    Calculator.calculate();
    
    Utils.showToast('Bill loaded successfully!', 'success');
  },

  // Delete a bill from history
  deleteBill: function(billId) {
    let bills = JSON.parse(localStorage.getItem('savedBills')) || [];
    bills = bills.filter(bill => bill.id !== billId);
    localStorage.setItem('savedBills', JSON.stringify(bills));
    
    Utils.showToast('Bill deleted successfully!', 'success');
  },

  // Initialize search and filter for history
  initializeHistorySearch: function() {
    const searchInput = document.getElementById('historySearch');
    const filterSelect = document.getElementById('historyFilter');
    
    searchInput.addEventListener('input', function() {
      History.filterBillHistory();
    });
    
    filterSelect.addEventListener('change', function() {
      History.filterBillHistory();
    });
  },

  // Filter bill history based on search and filter
  filterBillHistory: function() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const filterValue = document.getElementById('historyFilter').value;
    
    const bills = JSON.parse(localStorage.getItem('savedBills')) || [];
    let filteredBills = [...bills];
    
    // Apply date filter
    if (filterValue !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      if (filterValue === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filterValue === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (filterValue === 'year') {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }
      
      filteredBills = filteredBills.filter(bill => new Date(bill.date) >= cutoffDate);
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredBills = filteredBills.filter(bill => {
        const searchTarget = (bill.restaurant + ' ' + bill.location + ' ' + new Date(bill.date).toLocaleDateString()).toLowerCase();
        return searchTarget.includes(searchTerm);
      });
    }
    
    // Update the history list
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (filteredBills.length === 0) {
      historyList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No matching bills found.</div>';
      return;
    }
    
    // Sort bills by date (most recent first)
    filteredBills.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create bill history items (same logic as in loadBillHistory)
    for (const bill of filteredBills) {
      const billDate = new Date(bill.date).toLocaleDateString();
      
      // Calculate total amount
      let totalAmount = 0;
      for (const person of bill.people) {
        let personTotal = 0;
        for (const item of person.items) {
          personTotal += item.price;
        }
        
        const taxAmount = personTotal * (bill.taxPercentage / 100);
        const additionalFee = bill.additionalFee / bill.people.length;
        totalAmount += personTotal + taxAmount + additionalFee;
      }
      
      const billItem = document.createElement('div');
      billItem.className = 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow';
      billItem.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${bill.restaurant}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">${bill.location} • ${billDate}</p>
            <p class="text-sm mt-1">People: ${bill.people.length}</p>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-gray-900 dark:text-white">${Utils.formatCurrency(totalAmount)}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button class="load-bill-btn px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm" data-bill-id="${bill.id}">
            <i class="fas fa-sync-alt mr-1"></i> Load
          </button>
          <button class="delete-bill-btn px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm" data-bill-id="${bill.id}">
            <i class="fas fa-trash mr-1"></i> Delete
          </button>
        </div>
      `;
      
      historyList.appendChild(billItem);
    }
    
    // Add event listeners for load and delete buttons
    document.querySelectorAll('.load-bill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const billId = this.dataset.billId;
        History.loadBill(billId);
        History.closeHistoryModal();
      });
    });
    
    document.querySelectorAll('.delete-bill-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const billId = this.dataset.billId;
        History.deleteBill(billId);
        History.filterBillHistory(); // Refresh the filtered history list
      });
    });
  }
}; 