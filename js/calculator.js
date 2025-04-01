// Bill calculation functionality for SplitInvoice

const Calculator = {
  // Calculate the bill
  calculate: function() {
    const personFields = document.getElementsByClassName("person-field");
    const personCount = personFields.length;

    const taxInput = document.getElementById("taxInput");
    const additionalFeeInput = document.getElementById("additionalFeeInput");

    const taxPercentage = parseFloat(taxInput.value) || 0;
    const additionalFee = parseFloat(additionalFeeInput.value) || 0;

    let resultsHTML = "";

    let totalFoodPrice = 0;
    let totalTaxAmount = 0;
    let totalAdditionalFee = 0;
    let totalAmount = 0;

    // Individual person calculations
    for (let i = 0; i < personCount; i++) {
      const personField = personFields[i];
      const personLabel = personField.getElementsByTagName("h3")[0];
      const personName = personLabel.textContent;

      const foodPrices = personField.getElementsByClassName("food-price");
      const foodCount = foodPrices.length;

      let personTotal = 0;

      for (let j = 0; j < foodCount; j++) {
        const foodPrice = parseFloat(foodPrices[j].value);

        if (!isNaN(foodPrice)) {
          personTotal += foodPrice;
        }
      }

      const personAdditionalFee = additionalFee / personCount;
      const taxAmount = personTotal * (taxPercentage / 100);
      const personTotalAmount = personTotal + taxAmount + personAdditionalFee;

      resultsHTML += `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">${personName}</h3>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Food Total:</span>
              <span class="font-medium">${Utils.formatCurrency(personTotal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Tax (${taxPercentage}%):</span>
              <span class="font-medium">${Utils.formatCurrency(taxAmount)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Additional Fee:</span>
              <span class="font-medium">${Utils.formatCurrency(personAdditionalFee)}</span>
            </div>
            <div class="flex justify-between pt-1 border-t dark:border-gray-700">
              <span class="font-semibold text-gray-800 dark:text-white">Total:</span>
              <span class="font-bold text-primary-600 dark:text-primary-400">${Utils.formatCurrency(personTotalAmount)}</span>
            </div>
          </div>
        </div>
      `;

      totalFoodPrice += personTotal;
      // Note: Tax and Additional Fee are currently calculated per person based on their items.
      // Scanned items are not assigned to a person, so they won't directly affect per-person tax/fee share here.
      // Tax and Fee will be applied based on the overall totalFoodPrice later.
      // totalTaxAmount += taxAmount; // This is calculated later based on combined food total
      // totalAdditionalFee += personAdditionalFee; // This is calculated later based on combined food total
      // totalAmount += personTotalAmount; // This is calculated later based on combined food total + tax + fee
    }

    // Add prices from the general scanned items section
    let totalScannedItemsPrice = 0;
    const scannedItemInputs = document.querySelectorAll('#scannedItemsList .scanned-item-price');
    scannedItemInputs.forEach(input => {
        const price = parseFloat(input.value);
        if (!isNaN(price)) {
            totalScannedItemsPrice += price;
        }
    });
    totalFoodPrice += totalScannedItemsPrice; // Add scanned items total to the overall food total

    // Now calculate overall tax and total based on the combined food price
    totalTaxAmount = totalFoodPrice * (taxPercentage / 100);
    // Distribute additional fee evenly across people *and* the general scanned items pool (conceptually)
    // Or simply add the total additional fee to the grand total. Let's add it to the grand total for simplicity.
    totalAdditionalFee = additionalFee; // Use the full fee for the grand total calculation
    totalAmount = totalFoodPrice + totalTaxAmount + totalAdditionalFee;

    // Update individual results display (tax/fee share might be slightly different now if based on overall total)
    // Re-calculate and update the individual results HTML based on the final totalFoodPrice
    resultsHTML = ""; // Reset results HTML
    for (let i = 0; i < personCount; i++) {
        const personField = personFields[i];
        const personLabel = personField.getElementsByTagName("h3")[0];
        const personName = personLabel.textContent;
        const foodPrices = personField.getElementsByClassName("food-price");
        let personFoodTotal = 0;
        for (let j = 0; j < foodPrices.length; j++) {
            const foodPrice = parseFloat(foodPrices[j].value);
            if (!isNaN(foodPrice)) {
                personFoodTotal += foodPrice;
            }
        }

        // Calculate share of tax and fee based on proportion of total food cost (excluding scanned items for simplicity here,
        // as assigning scanned items is complex. Alternatively, distribute based on person count only).
        // Let's distribute tax/fee based on person count for simplicity, ignoring scanned items for individual share.
        const personTaxShare = (personFoodTotal / totalFoodPrice) * totalTaxAmount || 0; // Proportionate tax based on food total
        const personFeeShare = totalAdditionalFee / personCount || 0; // Even split of fee
        const personTotalAmount = personFoodTotal + personTaxShare + personFeeShare;

        // Regenerate individual results HTML with updated shares
         resultsHTML += `
           <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
             <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">${personName}</h3>
             <div class="space-y-1 text-sm">
               <div class="flex justify-between">
                 <span class="text-gray-600 dark:text-gray-300">Food Total:</span>
                 <span class="font-medium">${Utils.formatCurrency(personFoodTotal)}</span>
               </div>
               <div class="flex justify-between">
                 <span class="text-gray-600 dark:text-gray-300">Tax Share:</span>
                 <span class="font-medium">${Utils.formatCurrency(personTaxShare)}</span>
               </div>
               <div class="flex justify-between">
                 <span class="text-gray-600 dark:text-gray-300">Fee Share:</span>
                 <span class="font-medium">${Utils.formatCurrency(personFeeShare)}</span>
               </div>
               <div class="flex justify-between pt-1 border-t dark:border-gray-700">
                 <span class="font-semibold text-gray-800 dark:text-white">Total Due:</span>
                 <span class="font-bold text-primary-600 dark:text-primary-400">${Utils.formatCurrency(personTotalAmount)}</span>
               </div>
             </div>
           </div>
         `;
    }



    // Overall total section
    resultsHTML += `
      <div class="bg-accent-purple/10 dark:bg-accent-purple/20 rounded-lg p-5 mt-6 border-2 border-accent-purple/20 dark:border-accent-purple/30 shadow-lg">
        <h3 class="text-xl font-bold text-accent-purple dark:text-accent-purple mb-3">Total Bill</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-700 dark:text-gray-300">Subtotal (All Food + Scanned):</span>
            <span class="font-medium text-gray-900 dark:text-white">${Utils.formatCurrency(totalFoodPrice)}</span>
          </div>
           <div class="flex justify-between">
             <span class="text-gray-700 dark:text-gray-300">Tax (${taxPercentage}%):</span>
             <span class="font-medium text-gray-900 dark:text-white">${Utils.formatCurrency(totalTaxAmount)}</span>
           </div>
           <div class="flex justify-between">
             <span class="text-gray-700 dark:text-gray-300">Additional Fee:</span>
             <span class="font-medium text-gray-900 dark:text-white">${Utils.formatCurrency(totalAdditionalFee)}</span>
           </div>
          <div class="flex justify-between pt-3 mt-1 border-t dark:border-gray-600">
            <span class="font-bold text-gray-900 dark:text-white text-lg">Grand Total:</span>
            <span class="font-bold text-accent-purple dark:text-accent-purple text-lg">${Utils.formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    `;

    const resultsElement = document.getElementById("results");
    resultsElement.innerHTML = resultsHTML;
    resultsElement.classList.remove("hidden");
    
  },

  // Save the current bill
  saveBill: function() {
    // Get all the necessary bill data
    const restaurant = document.getElementById('restaurantInput').value || 'Unknown Restaurant';
    const location = document.getElementById('locationInput').value || 'Unknown Location';
    const taxPercentage = parseFloat(document.getElementById('taxInput').value) || 0;
    const additionalFee = parseFloat(document.getElementById('additionalFeeInput').value) || 0;
    const notes = document.getElementById('notesInput').value || '';
    const date = new Date().toISOString();
    
    // Get people and their items
    const people = [];
    const personFields = document.getElementsByClassName("person-field");
    let totalAmount = 0;
    
    for (let i = 0; i < personFields.length; i++) {
      const personField = personFields[i];
      const personName = personField.querySelector("h3").textContent;
      const foodItems = [];
      
      let personTotal = 0;
      const priceInputs = personField.querySelectorAll(".food-price");
      for (let j = 0; j < priceInputs.length; j++) {
        const price = parseFloat(priceInputs[j].value);
        if (!isNaN(price)) {
          foodItems.push({
            price: price,
            description: `Item ${j + 1}`
          });
          personTotal += price;
        }
      }
      
      const taxAmount = personTotal * (taxPercentage / 100);
      const personAdditionalFee = additionalFee / personFields.length;
      const personTotalAmount = personTotal + taxAmount + personAdditionalFee;
      
      totalAmount += personTotalAmount;
      
      people.push({
        name: personName,
        items: foodItems,
        amount: personTotalAmount
      });
    }
    
    // Create bill object
    const bill = {
      id: Date.now().toString(),
      date: date,
      restaurant: restaurant,
      location: location,
      taxPercentage: taxPercentage,
      additionalFee: additionalFee,
      notes: notes,
      people: people,
      totalAmount: totalAmount
    };
    
    // Get existing bills
    let bills = JSON.parse(localStorage.getItem('savedBills')) || [];
    bills.push(bill);
    
    // Save updated bills
    localStorage.setItem('savedBills', JSON.stringify(bills));
    
    // Show toast notification
    Utils.showToast('Bill saved successfully!', 'success');
  },

  // Export the bill to PDF
  exportToPDF: function() {
    try {
      // Create a new PDF document
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // PDF styling helpers - Always use dark colors for PDF text to ensure visibility
      const pdfColors = {
        primary: '#121214',
        secondary: '#1E1E24',
        text: '#121214',          // Dark text for visibility
        textSecondary: '#4B5563', // Dark secondary text
        accent: '#8B5CF6',
        success: '#4ADE80',
        divider: '#9CA3AF'
      };

      // Helper functions for consistent styling
      const setHeaderStyle = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(pdfColors.text);
      };

      const setTitleStyle = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(pdfColors.text);
      };

      const setSubtitleStyle = () => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(pdfColors.textSecondary);
      };

      const setBodyStyle = () => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(pdfColors.text);
      };

      const addDivider = (y) => {
        doc.setDrawColor(pdfColors.divider);
        doc.setLineWidth(0.1);
        doc.line(20, y, 190, y);
        return y + 5;
      };

      // Get bill data
      const restaurant = document.getElementById('restaurantInput').value || 'Unknown Restaurant';
      const location = document.getElementById('locationInput').value || 'Unknown Location';
      const date = new Date().toLocaleDateString();
      const notes = document.getElementById("notesInput").value || '';
      
      // Header section
      let yPos = 20;
      
      // Add logo/brand name
      setHeaderStyle();
      doc.text('SplitInvoice', 105, yPos, { align: 'center' });
      
      // Add invoice details
      yPos += 15;
      setTitleStyle();
      doc.text(restaurant, 105, yPos, { align: 'center' });
      
      yPos += 8;
      setSubtitleStyle();
      doc.text(`${location} • ${date}`, 105, yPos, { align: 'center' });
      
      yPos = addDivider(yPos + 10);

      // Get calculation details
      const personFields = document.getElementsByClassName("person-field");
      const taxPercentage = parseFloat(document.getElementById("taxInput").value) || 0;
      const additionalFee = parseFloat(document.getElementById("additionalFeeInput").value) || 0;
      
      // Summary section
      yPos += 10;
      setTitleStyle();
      doc.text('Bill Summary', 20, yPos);
      
      yPos += 8;
      setBodyStyle();
      doc.text(`Number of People: ${personFields.length}`, 25, yPos);
      yPos += 6;
      doc.text(`Tax Rate: ${taxPercentage}%`, 25, yPos);
      yPos += 6;
      doc.text(`Additional Fees: ${Utils.formatCurrency(additionalFee)}`, 25, yPos);
      
      yPos = addDivider(yPos + 10);

      // Individual details section
      let totalAmount = 0;
      
      for (let i = 0; i < personFields.length; i++) {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const personField = personFields[i];
        const personName = personField.querySelector("h3").textContent;
        
        // Calculate person's total
        const priceInputs = personField.querySelectorAll(".food-price");
        let personTotal = 0;
        
        for (let j = 0; j < priceInputs.length; j++) {
          const price = parseFloat(priceInputs[j].value);
          if (!isNaN(price)) {
            personTotal += price;
          }
        }
        
        const personAdditionalFee = additionalFee / personFields.length;
        const taxAmount = personTotal * (taxPercentage / 100);
        const personTotalAmount = personTotal + taxAmount + personAdditionalFee;
        
        totalAmount += personTotalAmount;
        
        // Add person details
        setTitleStyle();
        doc.text(personName, 20, yPos);
        
        yPos += 8;
        setBodyStyle();
        
        // Create a table-like structure for the breakdown
        const col1X = 25;
        const col2X = 80;
        
        doc.text('Item', col1X, yPos);
        doc.text('Amount', col2X, yPos);
        yPos += 5;
        
        doc.setDrawColor(pdfColors.divider);
        doc.setLineWidth(0.1);
        doc.line(col1X, yPos, 120, yPos);
        yPos += 5;
        
        doc.text('Food Total:', col1X, yPos);
        doc.text(Utils.formatCurrency(personTotal), col2X, yPos);
        yPos += 5;
        
        doc.text('Tax Amount:', col1X, yPos);
        doc.text(Utils.formatCurrency(taxAmount), col2X, yPos);
        yPos += 5;
        
        doc.text('Additional Fee:', col1X, yPos);
        doc.text(Utils.formatCurrency(personAdditionalFee), col2X, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', col1X, yPos);
        doc.text(Utils.formatCurrency(personTotalAmount), col2X, yPos);
        
        yPos += 15;
      }
      
      // Final total section
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos = addDivider(yPos);
      yPos += 10;
      
      setTitleStyle();
      doc.text('Grand Total', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(20);
      doc.setTextColor(pdfColors.accent);
      doc.text(Utils.formatCurrency(totalAmount), 25, yPos);
      
      // Add notes if available
      if (notes) {
        yPos += 15;
        setTitleStyle();
        doc.setTextColor(pdfColors.text);
        doc.text('Notes', 20, yPos);
        yPos += 8;
        setBodyStyle();
        doc.text(notes, 25, yPos);
      }
      
      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(pdfColors.textSecondary);
      const footerText = `Generated by SplitInvoice • ${new Date().toLocaleString()}`;
      doc.text(footerText, 105, 285, { align: 'center' });
      
      // Save the PDF
      const fileName = `SplitInvoice_${restaurant.replace(/[^a-z0-9]/gi, '_')}_${date.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      // Show success notification
      Utils.showToast('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Utils.showToast('Failed to generate PDF. Please try again.', 'error');
    }
  }
}; 