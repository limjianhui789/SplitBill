// Utility functions for SplitInvoice

const Utils = {
  // Format currency based on user settings
  formatCurrency: function(value) {
    const currencySymbol = localStorage.getItem('currencySymbol') || '$';
    const symbolPosition = localStorage.getItem('symbolPosition') || 'prefix';
    
    if (isNaN(value)) {
      value = 0;
    }
    
    const formattedValue = value.toFixed(2);
    
    if (symbolPosition === 'prefix') {
      return currencySymbol + formattedValue;
    } else {
      return formattedValue + currencySymbol;
    }
  },
  
  // Show toast notification
  showToast: function(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `py-2 px-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  },
  
  // Handle calculator-like input in price fields
  handleCalculatorInput: function(input) {
    const expression = input.value;
    try {
      // Simple calculator functionality
      if (expression.includes('+') || expression.includes('-') || 
          expression.includes('*') || expression.includes('/')) {
        // Using Function constructor to safely evaluate the expression
        const result = new Function('return ' + expression)();
        if (!isNaN(result)) {
          input.value = result;
        }
      }
      
      // Auto-calculate if enabled
      if (localStorage.getItem('autoCalculate') === 'true') {
        Calculator.calculate();
      }
    } catch (e) {
      // Silent error - keep the expression as is
    }
  },

  // Select all text in an element
  selectAllText: function(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
,

  // Escape HTML special characters to prevent XSS
  escapeHTML: function(str) {
    if (typeof str !== 'string') return str; // Return non-strings as is
    return str.replace(/[&<>"']/g, function(tag) {
      const chars_to_replace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return chars_to_replace[tag] || tag;
    });
  }
}; 