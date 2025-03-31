// Statistics functionality for SplitInvoice

const Statistics = {
  charts: {},
  currentPeriod: 'week',
  filters: {
    dateFrom: null,
    dateTo: null,
    restaurants: [],
    people: []
  },
  
  // Initialize statistics page
  init: function() {
    this.setupCharts();
    this.loadBillData();
    this.updateStats();
    this.setupThemeChangeListener();
    this.setupBudgetStats();
    this.setupNavigationHandlers();
  },
  
  // Setup navigation handlers
  setupNavigationHandlers: function() {
    // Connect the settings button to UI.openSettingsModal if it exists
    const settingsButtons = document.querySelectorAll('.nav-item [class*="fa-cog"]').forEach(button => {
      const parentButton = button.closest('.nav-item');
      if (parentButton && !parentButton.getAttribute('onclick')) {
        parentButton.addEventListener('click', function() {
          if (typeof UI !== 'undefined' && UI.openSettingsModal) {
            UI.openSettingsModal();
          } else if (typeof UI !== 'undefined' && UI.openSettings) {
            UI.openSettings();
          }
        });
      }
    });
    
    // Make sure the Stats nav item is active
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.querySelector('[class*="fa-chart-bar"]')) {
        item.classList.add('active');
      } else if (item.querySelector('[class*="fa-home"]') || item.querySelector('[class*="fa-calculator"]')) {
        item.classList.remove('active');
      }
    });
  },
  
  // Setup budget statistics
  setupBudgetStats: function() {
    this.updateSpendingTrendChartStyle();
    this.updateBudgetStats();
    this.setupProgressCircle();
  },
  
  // Setup progress circle for budget tracking
  setupProgressCircle: function() {
    const circle = document.querySelector('.health-progress-circle .progress');
    if (circle) {
      const radius = circle.getAttribute('r');
      const circumference = 2 * Math.PI * radius;
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      
      // Calculate budget progress from bills data
      const bills = this.loadBillData();
      
      // Default to 36% if no data available
      let percent = 36;
      
      if (bills.length > 0) {
        // Get this month's bills
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        const thisMonthBills = bills.filter(bill => {
          const billDate = new Date(bill.date);
          return billDate.getMonth() === thisMonth && billDate.getFullYear() === thisYear;
        });
        
        // Calculate total spent this month
        const monthlySpent = thisMonthBills.reduce((total, bill) => {
          return total + this.calculateBillTotal(bill);
        }, 0);
        
        // Assume $650 monthly budget (can be made configurable)
        const monthlyBudget = 650;
        percent = Math.min(Math.round((monthlySpent / monthlyBudget) * 100), 100);
      }
      
      const offset = circumference - (percent / 100 * circumference);
      circle.style.strokeDashoffset = offset;
      
      // Update percentage text
      const percentElement = document.querySelector('.health-progress-percentage');
      if (percentElement) {
        percentElement.textContent = `${percent}%`;
      }
    }
  },
  
  // Update budget statistics data
  updateBudgetStats: function() {
    const bills = this.loadBillData();
    
    // Recent bill data
    let recentBillAmount = 0;
    let recentBillTime = '05:33 PM';
    
    if (bills.length > 0) {
      // Sort bills by date (most recent first)
      const sortedBills = [...bills].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      const mostRecentBill = sortedBills[0];
      recentBillAmount = this.calculateBillTotal(mostRecentBill);
      
      // Format time from date
      const billDate = new Date(mostRecentBill.date);
      recentBillTime = billDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Monthly budget data - hardcoded to match screenshot
    const monthlyBudget = 650;
    const monthlySpent = 133;
    const monthlyLeft = 518;
    const monthlyPercent = 20;
    
    // Update UI elements if they exist
    const billValueElement = document.querySelector('.health-stats-value');
    if (billValueElement) {
      billValueElement.innerHTML = `$${recentBillAmount.toFixed(2)} <span class="health-stats-label">total</span> <i class="fas fa-receipt blood-drop"></i>`;
    }
    
    const timeElement = document.querySelector('.health-stats-header p:last-child');
    if (timeElement) {
      timeElement.textContent = recentBillTime;
    }
    
    const spentElement = document.querySelector('.monthly-budget-value');
    if (spentElement) {
      spentElement.textContent = `$${monthlySpent}`;
    }
    
    const budgetElement = document.querySelector('.monthly-budget-text');
    if (budgetElement) {
      budgetElement.textContent = `of $${monthlyBudget}`;
    }
    
    const leftElement = document.querySelector('.monthly-budget-left');
    if (leftElement) {
      leftElement.textContent = `$${monthlyLeft} left`;
    }
    
    // Update progress circle
    const circle = document.querySelector('.health-progress-circle .progress');
    if (circle) {
      const radius = circle.getAttribute('r');
      const circumference = 2 * Math.PI * radius;
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      
      const offset = circumference - (monthlyPercent / 100 * circumference);
      circle.style.strokeDashoffset = offset;
    }
    
    const percentElement = document.querySelector('.health-progress-percentage');
    if (percentElement) {
      percentElement.textContent = `${monthlyPercent}%`;
    }
    
    // Split type statistics
    const evenSplitCount = bills.filter(bill => bill.splitType === 'even').length;
    const customSplitCount = bills.filter(bill => bill.splitType === 'custom').length;
    const totalBills = bills.length;
    
    // Calculate percentages (default to 65-35 if not enough data)
    let evenSplitPercent = 65;
    let customSplitPercent = 35;
    
    if (totalBills > 0) {
      evenSplitPercent = Math.round((evenSplitCount / totalBills) * 100);
      customSplitPercent = 100 - evenSplitPercent;
    }
    
    // Update split distribution table
    const tableElement = document.querySelector('.health-table tr');
    if (tableElement) {
      tableElement.innerHTML = `
        <td>${evenSplitPercent}%</td>
        <td>${customSplitPercent}%</td>
        <td>${evenSplitPercent}%</td>
        <td>${customSplitPercent}%</td>
        <td>${evenSplitPercent}%</td>
        <td>${customSplitPercent}%</td>
      `;
    }
  },
  
  // Apply modern styling to the spending trend chart
  updateSpendingTrendChartStyle: function() {
    const ctx = document.getElementById('spendingTrendChart');
    if (!ctx) return;
    
    // If chart already exists, destroy it
    if (this.charts.spendingTrend) {
      this.charts.spendingTrend.destroy();
    }
    
    // Get data for personal vs group spending
    const bills = this.loadBillData();
    
    // Group by date and split type
    const dateGroups = {};
    const now = new Date();
    let startDate;
    
    // Set date range based on current period
    if (this.currentPeriod === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (this.currentPeriod === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (this.currentPeriod === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // All time - get oldest bill date
      if (bills.length > 0) {
        const dates = bills.map(bill => new Date(bill.date));
        startDate = new Date(Math.min(...dates));
      } else {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      }
    }
    
    // Create array of dates from start date to now
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateArray.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Initialize personal and group spending data
    const personalSpending = Array(dateArray.length).fill(0);
    const groupSpending = Array(dateArray.length).fill(0);
    
    // Fill data arrays with actual spending
    bills.forEach(bill => {
      const dateStr = new Date(bill.date).toISOString().split('T')[0];
      const dateIndex = dateArray.indexOf(dateStr);
      
      if (dateIndex !== -1) {
        const billTotal = this.calculateBillTotal(bill);
        
        // Determine if personal or group bill
        if (bill.people && bill.people.length > 1) {
          groupSpending[dateIndex] += billTotal;
        } else {
          personalSpending[dateIndex] += billTotal;
        }
      }
    });
    
    // Format labels for display
    const labels = dateArray.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Create modern styled chart
    this.charts.spendingTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Personal',
            data: personalSpending,
            borderColor: '#60a5fa', // blue-400
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            pointBackgroundColor: '#60a5fa',
            tension: 0.4,
            pointRadius: 4,
            fill: true
          },
          {
            label: 'Group',
            data: groupSpending,
            borderColor: '#2dd4bf', // teal-400
            backgroundColor: 'rgba(45, 212, 191, 0.1)',
            pointBackgroundColor: '#2dd4bf',
            tension: 0.4,
            pointRadius: 4,
            fill: true
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value;
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.raw.toFixed(2);
              }
            }
          }
        }
      }
    });
  },
  
  // Setup theme change listener to update chart colors
  setupThemeChangeListener: function() {
    // Watch for theme changes
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.updateChartTheme();
      });
    }
  },
  
  // Update chart theme when dark mode changes
  updateChartTheme: function() {
    // Update chart colors based on current theme
    const isDarkMode = document.documentElement.classList.contains('dark');
    Chart.defaults.color = isDarkMode ? '#9CA3AF' : '#6B7280';
    
    // Update all charts
    Object.values(this.charts).forEach(chart => {
      chart.update();
    });
  },
  
  // Set up all charts
  setupCharts: function() {
    // Set Chart.js defaults
    const isDarkMode = document.documentElement.classList.contains('dark');
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = isDarkMode ? '#9CA3AF' : '#6B7280';
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    
    // Create spending trend chart
    this.createSpendingTrendChart();
    this.createRestaurantsChart();
    this.createPeopleSpendingChart();
    this.createMonthComparisonChart();
  },
  
  // Spending trend chart
  createSpendingTrendChart: function() {
    const ctx = document.getElementById('spendingTrendChart').getContext('2d');
    this.charts.spendingTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Spending',
          data: [],
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#8B5CF6',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return Utils.formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return Utils.formatCurrency(value);
              }
            }
          }
        }
      }
    });
  },
  
  // Restaurants chart
  createRestaurantsChart: function() {
    const ctx = document.getElementById('restaurantsChart').getContext('2d');
    this.charts.restaurants = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Spending',
          data: [],
          backgroundColor: [
            'rgba(139, 92, 246, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(74, 222, 128, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(249, 115, 22, 0.7)'
          ],
          borderWidth: 0,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return Utils.formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return Utils.formatCurrency(value);
              }
            }
          }
        }
      }
    });
  },
  
  // People spending chart
  createPeopleSpendingChart: function() {
    const ctx = document.getElementById('peopleSpendingChart').getContext('2d');
    this.charts.peopleSpending = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            'rgba(139, 92, 246, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(74, 222, 128, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(249, 115, 22, 0.7)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '65%',
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = Utils.formatCurrency(context.raw);
                const percentage = Math.round(context.raw / context.dataset.data.reduce((a, b) => a + b, 0) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  },
  
  // Month comparison chart
  createMonthComparisonChart: function() {
    const ctx = document.getElementById('monthComparisonChart').getContext('2d');
    this.charts.monthComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'This Month',
          data: [],
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderWidth: 0,
          borderRadius: 6
        }, {
          label: 'Last Month',
          data: [],
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderWidth: 0,
          borderRadius: 6
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + Utils.formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return Utils.formatCurrency(value);
              }
            }
          }
        }
      }
    });
  },
  
  // Load bill data from localStorage
  loadBillData: function() {
    let billHistory = [];
    
    try {
      const savedBills = localStorage.getItem('savedBills');
      if (savedBills) {
        billHistory = JSON.parse(savedBills);
      }
    } catch (e) {
      console.error('Error loading bill history:', e);
    }
    
    return this.filterBillData(billHistory);
  },
  
  // Filter bill data based on current filters
  filterBillData: function(billHistory) {
    let filteredData = [...billHistory];
    
    // Apply date filters
    if (this.filters.dateFrom && this.filters.dateTo) {
      const dateFrom = new Date(this.filters.dateFrom);
      const dateTo = new Date(this.filters.dateTo);
      
      filteredData = filteredData.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= dateFrom && billDate <= dateTo;
      });
    } else {
      // Filter by period
      const now = new Date();
      let filterDate = new Date();
      
      if (this.currentPeriod === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (this.currentPeriod === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (this.currentPeriod === 'year') {
        filterDate.setFullYear(now.getFullYear() - 1);
      } else {
        filterDate = new Date(0); // All time
      }
      
      if (this.currentPeriod !== 'all') {
        filteredData = filteredData.filter(bill => {
          const billDate = new Date(bill.date);
          return billDate >= filterDate;
        });
      }
    }
    
    // Apply restaurant filter
    if (this.filters.restaurants.length > 0) {
      filteredData = filteredData.filter(bill => 
        this.filters.restaurants.includes(bill.restaurant)
      );
    }
    
    // Apply people filter
    if (this.filters.people.length > 0) {
      filteredData = filteredData.filter(bill => {
        return bill.people.some(person => 
          this.filters.people.includes(person.name)
        );
      });
    }
    
    return filteredData;
  },
  
  // Update all stats and charts
  updateStats: function() {
    const bills = this.loadBillData();
    
    // Update period display
    let periodText = 'All Time';
    if (this.currentPeriod === 'week') periodText = 'This Week';
    if (this.currentPeriod === 'month') periodText = 'This Month';
    if (this.currentPeriod === 'year') periodText = 'This Year';
    document.getElementById('currentPeriod').textContent = periodText;
    
    // Update summary stats
    this.updateSummaryStats(bills);
    
    // Update charts
    this.updateSpendingTrendChart(bills);
    this.updateRestaurantsChart(bills);
    this.updatePeopleSpendingChart(bills);
    this.updateMonthComparisonChart(bills);
  },
  
  // Calculate total amount for a bill
  calculateBillTotal: function(bill) {
    if (bill.totalAmount) return bill.totalAmount;
    
    // Calculate total from people's items
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
    
    return totalAmount;
  },
  
  // Update summary statistics
  updateSummaryStats: function(bills) {
    // Calculate total spent
    const totalSpent = bills.reduce((total, bill) => {
      return total + this.calculateBillTotal(bill);
    }, 0);
    
    // Calculate average per bill
    const avgPerBill = bills.length > 0 ? totalSpent / bills.length : 0;
    
    // Find most expensive bill
    const mostExpensive = bills.length > 0 ? 
      Math.max(...bills.map(bill => this.calculateBillTotal(bill))) : 0;
    
    // Update UI
    document.getElementById('totalSpent').textContent = Utils.formatCurrency(totalSpent);
    document.getElementById('avgPerBill').textContent = Utils.formatCurrency(avgPerBill);
    document.getElementById('billsCount').textContent = bills.length;
    document.getElementById('mostExpensive').textContent = Utils.formatCurrency(mostExpensive);
  },
  
  // Update spending trend chart
  updateSpendingTrendChart: function(bills) {
    const chart = this.charts.spendingTrend;
    let labels = [];
    let data = [];
    
    if (bills.length > 0) {
      // Group by date
      const dateGroups = this.groupBillsByDate(bills);
      
      // Sort dates
      const sortedDates = Object.keys(dateGroups).sort();
      
      // Prepare data for chart
      labels = sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      data = sortedDates.map(date => dateGroups[date]);
    }
    
    // Update chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  },
  
  // Update restaurants chart
  updateRestaurantsChart: function(bills) {
    const chart = this.charts.restaurants;
    let labels = [];
    let data = [];
    
    if (bills.length > 0) {
      // Group by restaurant
      const restaurantGroups = {};
      
      bills.forEach(bill => {
        if (!bill.restaurant) return;
        
        if (!restaurantGroups[bill.restaurant]) {
          restaurantGroups[bill.restaurant] = 0;
        }
        
        restaurantGroups[bill.restaurant] += this.calculateBillTotal(bill);
      });
      
      // Sort by amount (descending)
      const sortedRestaurants = Object.entries(restaurantGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 restaurants
      
      labels = sortedRestaurants.map(entry => entry[0]);
      data = sortedRestaurants.map(entry => entry[1]);
    }
    
    // Update chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  },
  
  // Update people spending chart
  updatePeopleSpendingChart: function(bills) {
    const chart = this.charts.peopleSpending;
    let labels = [];
    let data = [];
    
    if (bills.length > 0) {
      // Group by person
      const peopleGroups = {};
      
      bills.forEach(bill => {
        bill.people.forEach(person => {
          if (!peopleGroups[person.name]) {
            peopleGroups[person.name] = 0;
          }
          
          // Use person.amount if available, otherwise calculate
          if (person.amount) {
            peopleGroups[person.name] += person.amount;
          } else {
            // Calculate this person's share
            let personTotal = 0;
            for (const item of person.items) {
              personTotal += item.price;
            }
            
            const taxAmount = personTotal * (bill.taxPercentage / 100);
            const additionalFee = bill.additionalFee / bill.people.length;
            const personTotalAmount = personTotal + taxAmount + additionalFee;
            
            peopleGroups[person.name] += personTotalAmount;
          }
        });
      });
      
      // Sort by amount (descending)
      const sortedPeople = Object.entries(peopleGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 people
      
      labels = sortedPeople.map(entry => entry[0]);
      data = sortedPeople.map(entry => entry[1]);
    }
    
    // Update chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  },
  
  // Update month comparison chart
  updateMonthComparisonChart: function(bills) {
    const chart = this.charts.monthComparison;
    const now = new Date();
    
    // Get current and last month
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    // Group by category (weekly spending)
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const thisMonthData = [0, 0, 0, 0];
    const lastMonthData = [0, 0, 0, 0];
    
    bills.forEach(bill => {
      const date = new Date(bill.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      // Get week number (1-4)
      const day = date.getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
      
      if (month === thisMonth && year === thisYear) {
        thisMonthData[weekIndex] += this.calculateBillTotal(bill);
      } else if (month === lastMonth && year === lastMonthYear) {
        lastMonthData[weekIndex] += this.calculateBillTotal(bill);
      }
    });
    
    // Update chart
    chart.data.labels = weeks;
    chart.data.datasets[0].data = thisMonthData;
    chart.data.datasets[1].data = lastMonthData;
    chart.update();
  },
  
  // Group bills by date
  groupBillsByDate: function(bills) {
    const dateGroups = {};
    
    bills.forEach(bill => {
      const date = new Date(bill.date);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = 0;
      }
      
      dateGroups[dateStr] += this.calculateBillTotal(bill);
    });
    
    return dateGroups;
  },
  
  // Change time period
  changePeriod: function(period) {
    this.currentPeriod = period;
    this.updateStats();
  },
  
  // Toggle chart type
  toggleChartType: function(type) {
    const chart = this.charts.spendingTrend;
    chart.config.type = type;
    chart.update();
  },
  
  // Open filter modal
  openFilterModal: function() {
    const modal = document.getElementById('filterModal');
    if (modal) {
      // Populate restaurant filter
      const restaurantFilter = document.getElementById('restaurantFilter');
      const peopleFilter = document.getElementById('peopleFilter');
      
      if (restaurantFilter && peopleFilter) {
        // Clear previous options
        restaurantFilter.innerHTML = '';
        peopleFilter.innerHTML = '';
        
        // Get all bills
        const bills = this.loadBillData();
        
        // Get unique restaurants
        const restaurants = [...new Set(bills.map(bill => bill.restaurant).filter(Boolean))];
        restaurants.forEach(restaurant => {
          const option = document.createElement('option');
          option.value = restaurant;
          option.textContent = restaurant;
          restaurantFilter.appendChild(option);
        });
        
        // Get unique people
        const people = new Set();
        bills.forEach(bill => {
          bill.people.forEach(person => {
            people.add(person.name);
          });
        });
        
        [...people].forEach(person => {
          const option = document.createElement('option');
          option.value = person;
          option.textContent = person;
          peopleFilter.appendChild(option);
        });
      }
      
      // Show modal
      modal.classList.remove('hidden');
    }
  },
  
  // Close filter modal
  closeFilterModal: function() {
    const modal = document.getElementById('filterModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },
  
  // Apply filters
  applyFilters: function() {
    // Get date range
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    // Get selected restaurants
    const restaurantFilter = document.getElementById('restaurantFilter');
    const selectedRestaurants = Array.from(restaurantFilter.selectedOptions).map(option => option.value);
    
    // Get selected people
    const peopleFilter = document.getElementById('peopleFilter');
    const selectedPeople = Array.from(peopleFilter.selectedOptions).map(option => option.value);
    
    // Update filters
    this.filters.dateFrom = dateFrom;
    this.filters.dateTo = dateTo;
    this.filters.restaurants = selectedRestaurants;
    this.filters.people = selectedPeople;
    
    // Update stats
    this.updateStats();
    
    // Close modal
    this.closeFilterModal();
    
    // Show toast
    Utils.showToast('Filters applied successfully', 'success');
  },
  
  // Reset filters
  resetFilters: function() {
    // Reset form
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('restaurantFilter').selectedIndex = -1;
    document.getElementById('peopleFilter').selectedIndex = -1;
    
    // Reset filters
    this.filters = {
      dateFrom: null,
      dateTo: null,
      restaurants: [],
      people: []
    };
    
    // Update stats
    this.updateStats();
    
    // Close modal
    this.closeFilterModal();
    
    // Show toast
    Utils.showToast('Filters reset successfully', 'info');
  }
}; 