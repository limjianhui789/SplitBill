// Main JavaScript entry point for SplitInvoice

// Function to apply the theme based on preference
function applyTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  
  if (savedTheme !== null) {
    // Use saved theme from localStorage
    if (savedTheme === 'true') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else {
    // No saved theme, check system preference as a fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      // Optionally save the detected preference for future visits
      // localStorage.setItem('darkMode', 'true'); 
    } else {
       document.documentElement.classList.remove('dark');
       // Optionally save the detected preference for future visits
      // localStorage.setItem('darkMode', 'false');
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Apply the theme preference first
  applyTheme();

  // Initialize UI
  UI.init();
  
  // Initialize animations
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true
  });
  
  // Person field animations
  document.querySelectorAll('.person-field').forEach((field, index) => {
    field.setAttribute('data-aos', 'fade-up');
    field.setAttribute('data-aos-delay', (index * 50 + 100).toString());
  });
  
  // Set current date
  const currentDateElement = document.getElementById('currentDate');
  if (currentDateElement) {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
  }
  
  // Set greeting based on time of day
  const greetingElement = document.getElementById('greeting');
  if (greetingElement) {
    const hour = new Date().getHours();
    let greeting = 'Hello!';
    
    if (hour < 12) {
      greeting = 'Good morning!';
    } else if (hour < 18) {
      greeting = 'Good afternoon!';
    } else {
      greeting = 'Good evening!';
    }
    
    greetingElement.textContent = greeting;
  }
  
  // Set up history button
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      History.openHistoryModal();
    });
  }
  
  // Set up group save button
  const groupSaveBtn = document.getElementById('groupSaveBtn');
  if (groupSaveBtn) {
    groupSaveBtn.addEventListener('click', () => {
      Group.openGroupModal();
    });
  }
  
  // Set up templates button
  const templateBtn = document.getElementById('templateBtn');
  if (templateBtn) {
    templateBtn.addEventListener('click', () => {
      Template.openTemplateModal();
    });
    
    // Add a "Save as Template" button after the template button
    const operationButtons = templateBtn.parentElement;
    if (operationButtons) {
      const saveAsTemplateBtn = document.createElement('button');
      saveAsTemplateBtn.type = 'button';
      saveAsTemplateBtn.className = 'btn btn-secondary';
      saveAsTemplateBtn.innerHTML = '<i class="fas fa-bookmark mr-1"></i><span>Save Template</span>';
      saveAsTemplateBtn.title = 'Save as Template';
      saveAsTemplateBtn.addEventListener('click', Template.saveAsTemplate);
      
      operationButtons.insertBefore(saveAsTemplateBtn, templateBtn.nextSibling);
    }
  }
  
  // --- Theme loading logic moved to applyTheme() called earlier ---
  // const isDarkMode = localStorage.getItem('darkMode') === 'true';
  // if (isDarkMode) {
  //   document.documentElement.classList.add('dark');
  // }
  
  // Save theme preference on toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', String(isDark)); // Store as string 'true' or 'false'
    });
  }
  
  // Load settings
  const currencySymbol = localStorage.getItem('currencySymbol');
  const symbolPosition = localStorage.getItem('symbolPosition');
  const saveLocationData = localStorage.getItem('saveLocationData');
  const autoCalculate = localStorage.getItem('autoCalculate');
  
  // Set settings in form
  if (currencySymbol) {
    const input = document.getElementById('currencySymbol');
    if (input) input.value = currencySymbol;
  }
  
  if (symbolPosition) {
    const select = document.getElementById('symbolPosition');
    if (select) select.value = symbolPosition;
  }
  
  if (saveLocationData) {
    const checkbox = document.getElementById('saveLocationData');
    if (checkbox) checkbox.checked = saveLocationData === 'true';
  }
  
  if (autoCalculate) {
    const checkbox = document.getElementById('autoCalculate');
    if (checkbox) checkbox.checked = autoCalculate === 'true';
  }
  
  // Initialize dropdowns for existing person fields - wait for full document load to ensure elements are ready
  setTimeout(() => {
    const personNameElements = document.querySelectorAll('.personName');
    personNameElements.forEach(element => {
      Person.createNameDropdown(element);
    });
    
    // Set up event delegation for dynamically added personName elements
    const personFieldsContainer = document.getElementById('personFields');
    if (personFieldsContainer) {
      personFieldsContainer.addEventListener('click', function(e) {
        const personName = e.target.closest('.personName');
        if (personName && !personName.dataset.dropdownInitialized) {
          personName.dataset.dropdownInitialized = 'true';
          Person.createNameDropdown(personName);
        }
      });
    }
  }, 100);
  
  // Initialize currency settings
  if (!localStorage.getItem('currencySymbol')) {
    localStorage.setItem('currencySymbol', '$');
  }
  
  if (!localStorage.getItem('symbolPosition')) {
    localStorage.setItem('symbolPosition', 'prefix');
  }
});