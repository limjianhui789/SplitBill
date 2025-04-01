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
          <i class="ti ti-history text-4xl text-gray-400 mb-4"></i>
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
              <i class="ti ti-tools-kitchen-2 text-primary-500"></i>
              ${bill.restaurant}
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <i class="ti ti-map-pin mr-1"></i>${bill.location}
            </p>
            <div class="history-meta-info mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="history-meta-tag inline-flex items-center gap-1">
                <i class="ti ti-users"></i>
                ${bill.people.length} people
              </span>
              <span class="history-meta-tag inline-flex items-center gap-1">
                <i class="ti ti-calendar"></i>
                ${billDate}
              </span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-gray-900 dark:text-white">${Utils.formatCurrency(totalAmount)}</p>
            <div class="mt-2 flex gap-2">
              <button class="load-bill-btn px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm inline-flex items-center gap-1" data-bill-id="${bill.id}">
                <i class="ti ti-refresh text-sm"></i> Load
              </button>
              <button class="delete-bill-btn px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm inline-flex items-center justify-center w-8 h-8" data-bill-id="${bill.id}" aria-label="Delete Bill">
                <i class="ti ti-trash text-sm"></i>
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
        // Optional: Add confirmation dialog here
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
    // Reset Person counter if applicable (assuming Person object manages this)
    if (typeof Person !== 'undefined' && Person.resetPersonCounter) {
      Person.resetPersonCounter();
    }

    bill.people.forEach(personData => {
      const personElement = Person.addPersonField(personData.name, false); // Pass name, don't focus

      // Get the newly added person field
      const personField = personElement; // addPersonField should return the element

      // Remove default empty item added by addPersonField
      const foodList = personField.querySelector(".person-food-list");
      const defaultItem = foodList.querySelector("li"); // Assuming the default is the first/only item
      if (defaultItem && defaultItem.querySelector('.food-price').value === '' && defaultItem.querySelector('.food-item-name') && defaultItem.querySelector('.food-item-name').value === '') {
        defaultItem.remove();
      }

      // Add items from the loaded bill for this person
      personData.items.forEach(item => {
        Person.addFoodItem(foodList.closest('.person-field').querySelector('.add-food-btn'), item.name, item.price); // Pass name and price
      });

       // Add one empty item row at the end for new entries
       Person.addFoodItem(foodList.closest('.person-field').querySelector('.add-food-btn'));
       // Remove the extra empty item potentially added by the previous loop's last call
        const items = foodList.querySelectorAll('li');
        if (items.length > 1) {
            const lastItemInput = items[items.length - 1].querySelector('.food-price');
            const secondLastItemInput = items[items.length - 2].querySelector('.food-price');
            if (lastItemInput && lastItemInput.value === '' && secondLastItemInput && secondLastItemInput.value === '') {
                 items[items.length - 1].remove();
            }
        }


    });


    // Recalculate totals after loading
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

    // Use 'input' event for immediate feedback
    searchInput.addEventListener('input', Utils.debounce(() => {
        History.filterBillHistory();
    }, 300)); // Debounce search input

    filterSelect.addEventListener('change', function() {
      History.filterBillHistory();
    });
     // Initial load when modal opens might be better placed in openHistoryModal
    // this.filterBillHistory();
  },

  // Filter bill history based on search and filter
  filterBillHistory: function() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase().trim();
    const filterValue = document.getElementById('historyFilter').value;
    const historyList = document.getElementById('historyList');

    const bills = JSON.parse(localStorage.getItem('savedBills')) || [];
    let filteredBills = [...bills];

    // Apply date filter
    if (filterValue !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();

      switch (filterValue) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
       // Set time to beginning of the day for accurate comparison
       cutoffDate.setHours(0, 0, 0, 0);

      filteredBills = filteredBills.filter(bill => new Date(bill.date) >= cutoffDate);
    }

    // Apply search filter (search name, location, date, or even people names)
    if (searchTerm) {
      filteredBills = filteredBills.filter(bill => {
         const billDateStr = new Date(bill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
         const peopleNames = bill.people.map(p => p.name).join(' ');
        const searchTarget = `${bill.restaurant} ${bill.location} ${billDateStr} ${peopleNames}`.toLowerCase();
        return searchTarget.includes(searchTerm);
      });
    }

    // Update the history list
    historyList.innerHTML = ''; // Clear previous results

    if (filteredBills.length === 0) {
      historyList.innerHTML = `
         <div class="p-8 text-center">
           <i class="ti ti-zoom-cancel text-4xl text-gray-400 mb-4"></i>
           <p class="text-gray-500 dark:text-gray-400">No matching bills found.</p>
         </div>`;
      return;
    }

    // Sort bills by date (most recent first) - redundancy if already sorted in loadBillHistory, but safe
    filteredBills.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Create bill history items (using the same structure as loadBillHistory)
    // Refactoring this into a shared function `_createBillHistoryItemHTML` would be ideal
    for (const bill of filteredBills) {
       const billDate = new Date(bill.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
       let totalAmount = bill.totalAmount || 0; // Use saved total amount if available

      const billItem = document.createElement('div');
       // Re-using the same class and structure from loadBillHistory for consistency
      billItem.className = 'bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 border border-gray-100 dark:border-gray-700';
      billItem.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <i class="ti ti-tools-kitchen-2 text-primary-500"></i>
              ${bill.restaurant}
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <i class="ti ti-map-pin mr-1"></i>${bill.location}
            </p>
             <div class="history-meta-info mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="history-meta-tag inline-flex items-center gap-1">
                <i class="ti ti-users"></i>
                ${bill.people.length} people
              </span>
              <span class="history-meta-tag inline-flex items-center gap-1">
                <i class="ti ti-calendar"></i>
                ${billDate}
              </span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-gray-900 dark:text-white">${Utils.formatCurrency(totalAmount)}</p>
             <div class="mt-2 flex gap-2">
               <button class="load-bill-btn px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm inline-flex items-center gap-1" data-bill-id="${bill.id}">
                 <i class="ti ti-refresh text-sm"></i> Load
               </button>
               <button class="delete-bill-btn px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm inline-flex items-center justify-center w-8 h-8" data-bill-id="${bill.id}" aria-label="Delete Bill">
                 <i class="ti ti-trash text-sm"></i>
               </button>
             </div>
          </div>
        </div>
      `;

      historyList.appendChild(billItem);
    }

    // Re-attach event listeners for the newly created buttons
    this._attachHistoryButtonListeners();
  },

  // Helper function to attach listeners (to avoid repetition)
  _attachHistoryButtonListeners: function() {
     document.querySelectorAll('#historyList .load-bill-btn').forEach(btn => {
         // Remove existing listener to prevent duplicates if re-attaching
         // A more robust way is to use a single listener on historyList and event delegation
         // btn.replaceWith(btn.cloneNode(true)); // Simple way to remove listeners
         // btn = historyList.querySelector(`[data-bill-id="${btn.dataset.billId}"].load-bill-btn`); // Re-select the cloned node

         // Using a flag to prevent multiple attachments might be simpler here
         if (!btn.hasAttribute('data-listener-attached')) {
            btn.addEventListener('click', function() {
                const billId = this.dataset.billId;
                History.loadBill(billId);
                History.closeHistoryModal();
            });
            btn.setAttribute('data-listener-attached', 'true');
         }
     });

     document.querySelectorAll('#historyList .delete-bill-btn').forEach(btn => {
         if (!btn.hasAttribute('data-listener-attached')) {
            btn.addEventListener('click', function() {
                const billId = this.dataset.billId;
                 // Optional: Add confirmation
                 if (confirm('Are you sure you want to delete this bill?')) {
                    History.deleteBill(billId);
                    // Refresh based on current view (filtered or full list)
                    // We call filterBillHistory as it handles both cases (search/filter or none)
                    History.filterBillHistory();
                 }
            });
            btn.setAttribute('data-listener-attached', 'true');
         }
     });
  },

  // Call initialization functions if they exist
  initialize: function() {
    if (document.getElementById('historySearch') && document.getElementById('historyFilter')) {
        this.initializeHistorySearch();
    }
     // Attach listeners initially if history list might be pre-populated (though likely not)
     // this._attachHistoryButtonListeners();
   }

};

// Initialize history features when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Attach listener to the main history button in the navbar
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', () => History.openHistoryModal());
  }

  // Initialize search/filter listeners inside the history modal
  History.initialize();
});