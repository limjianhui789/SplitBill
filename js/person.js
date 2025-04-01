// js/person.js - Handles person-specific logic and UI interactions

class Person {
    /**
     * Adds a new person field section to the DOM.
     * Handles cloning, resetting values, and updating person numbers.
     */
    static addPersonField() {
        console.log("Adding new person field...");
        const personFieldsContainer = document.getElementById('personFields');
        if (!personFieldsContainer) {
            console.error("Person fields container not found.");
            UI.showToast("Error adding person field.", "error");
            return;
        }

        const existingFields = personFieldsContainer.querySelectorAll('.person-field');
        const lastPersonField = existingFields[existingFields.length - 1];

        if (!lastPersonField) {
            console.error("Could not find the last person field to clone.");
            UI.showToast("Error adding person field template.", "error");
            // As a fallback, maybe load a predefined template? For now, just error out.
            return;
        }

        const newPersonField = lastPersonField.cloneNode(true);
        newPersonField.removeAttribute('data-aos'); // Remove AOS attribute to prevent re-animation on clone

        // Reset the name field
        const nameElement = newPersonField.querySelector('.personName h3');
        if (nameElement) {
            const newPersonNumber = existingFields.length + 1;
            nameElement.textContent = `Person ${newPersonNumber}`;
            // Also reset any stored group ID if applicable
            newPersonField.dataset.personId = ''; // Reset or generate new unique ID if needed
        } else {
            console.warn("Could not find name element in cloned field.");
        }

        // Clear all food item inputs except the first template row
        const foodList = newPersonField.querySelector('.person-food-list');
        if (foodList) {
            const items = foodList.querySelectorAll('li.food-item-row');
            // Keep only the first item row as a template, remove others
            items.forEach((item, index) => {
                if (index > 0) {
                    item.remove();
                } else {
                    // Reset the inputs in the first row
                    const nameInput = item.querySelector('.food-item-name');
                    const priceInput = item.querySelector('.food-price');
                    if (nameInput) nameInput.value = '';
                    if (priceInput) priceInput.value = '';
                    // Ensure the remove button is hidden on the first row if that's the desired logic
                    const removeBtn = item.querySelector('.remove-food-btn');
                    if(removeBtn) removeBtn.style.display = 'none'; // Hide remove on the first item initially
                }
            });

            // Ensure the first item has the add button and potentially visible remove button logic updated if needed
            const firstItem = foodList.querySelector('li.food-item-row');
             if (firstItem) {
                 const addBtn = firstItem.querySelector('.add-food-btn');
                 const removeBtn = firstItem.querySelector('.remove-food-btn');
                 if(addBtn) addBtn.style.display = 'inline-flex'; // Ensure add button is visible
                 if(removeBtn) removeBtn.style.display = 'none'; // Keep remove hidden for the single row
             }


        } else {
            console.warn("Could not find food list in cloned field.");
        }

        // Reset the total display if it exists within the person card (currently it doesn't)
        // const personTotalElement = newPersonField.querySelector('.person-total');
        // if (personTotalElement) personTotalElement.textContent = Utils.formatCurrency(0);

        // Append the new field and apply smooth transition
        newPersonField.style.opacity = '0';
        newPersonField.style.transform = 'translateY(10px)';
        personFieldsContainer.appendChild(newPersonField);

        // Trigger AOS manually if desired, or use simple transition
        requestAnimationFrame(() => {
             newPersonField.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
             newPersonField.style.opacity = '1';
             newPersonField.style.transform = 'translateY(0)';
        });

        // Add event listener for the name dropdown toggle
        UI.setupNameDropdown(newPersonField);

        UI.showToast(`Person ${existingFields.length + 1} added`, "success");
        console.log("New person field added successfully.");

        // Optional: Scroll the new element into view
        newPersonField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Update person numbers if necessary (though 'Person X' is handled above)
        // Person.updatePersonNumbers(); // Only needed if names aren't dynamic
    }

    /**
     * Adds a new food item row to the person's list.
     * @param {HTMLElement} addButton - The add button that was clicked.
     */
    static addFoodItem(addButton) {
        console.log("Adding new food item row...");
        const currentItemRow = addButton.closest('li.food-item-row');
        const foodList = currentItemRow?.closest('.person-food-list');

        if (!currentItemRow || !foodList) {
            console.error("Could not find the current item row or food list.", { currentItemRow, foodList });
            UI.showToast("Error adding item.", "error");
            return;
        }

        // Clone the current row to create a new one
        const newItemRow = currentItemRow.cloneNode(true);

        // Clear the input values in the new row
        const nameInput = newItemRow.querySelector('.food-item-name');
        const priceInput = newItemRow.querySelector('.food-price');
        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '';

        // Ensure the remove button is visible and functional in the new row
        const removeButton = newItemRow.querySelector('.remove-food-btn');
        if (removeButton) {
            removeButton.style.display = 'inline-flex'; // Make sure remove button is visible
            removeButton.onclick = () => Person.removeFoodItem(removeButton); // Ensure correct handler
        }

        // Ensure the add button is correctly configured (it should also trigger addFoodItem)
        const newAddButton = newItemRow.querySelector('.add-food-btn');
         if (newAddButton) {
             newAddButton.onclick = () => Person.addFoodItem(newAddButton); // Ensure correct handler
         }


        // Insert the new row after the current one
        // foodList.appendChild(newItemRow); // Appends at the end
        currentItemRow.parentNode.insertBefore(newItemRow, currentItemRow.nextSibling); // Inserts after current

        // Make the remove button visible on the *current* (now previous) row as well,
        // as it's no longer the only/last row for adding.
        const currentRemoveButton = currentItemRow.querySelector('.remove-food-btn');
        if (currentRemoveButton) {
            currentRemoveButton.style.display = 'inline-flex';
        }

        console.log("New food item row added.");

        // Optional: Focus the item name input in the new row
         if (nameInput) {
            nameInput.focus();
         }

        // Auto-calculate if the setting is enabled
        if (document.getElementById('autoCalculate')?.checked) {
            Calculator.calculate();
        }
    }

    /**
     * Removes a food item row from the person's list.
     * @param {HTMLElement} removeButton - The remove button that was clicked.
     */
    static removeFoodItem(removeButton) {
        console.log("Removing food item row...");
        const itemToRemove = removeButton.closest('li.food-item-row');
        const foodList = itemToRemove?.closest('.person-food-list');

        if (!itemToRemove || !foodList) {
            console.error("Could not find item row to remove or its list.", { itemToRemove, foodList });
            UI.showToast("Error removing item.", "error");
            return;
        }

        const remainingItems = foodList.querySelectorAll('li.food-item-row');

        // Prevent removing the very last item row for a person
        if (remainingItems.length <= 1) {
            console.warn("Cannot remove the last item row.");
            UI.showToast("Cannot remove the last item.", "warning");
            // Optionally clear the inputs instead of removing
            // const nameInput = itemToRemove.querySelector('.food-item-name');
            // const priceInput = itemToRemove.querySelector('.food-price');
            // if (nameInput) nameInput.value = '';
            // if (priceInput) priceInput.value = '';
            return;
        }

        // Apply fade-out animation before removing
        itemToRemove.style.transition = 'opacity 0.3s ease, transform 0.3s ease, height 0.3s ease';
        itemToRemove.style.opacity = '0';
        itemToRemove.style.transform = 'translateX(-10px)';
         // itemToRemove.style.height = '0'; // This might cause layout jumps, use padding/margin if needed
         itemToRemove.style.paddingTop = '0';
         itemToRemove.style.paddingBottom = '0';
         itemToRemove.style.marginTop = '0';
         itemToRemove.style.marginBottom = '0';
         // itemToRemove.style.overflow = 'hidden'; // Helps with collapsing height


        setTimeout(() => {
            itemToRemove.remove();
            console.log("Food item row removed successfully.");

             // After removing, check if only one item remains. If so, hide its remove button.
             const newRemainingItems = foodList.querySelectorAll('li.food-item-row');
             if (newRemainingItems.length === 1) {
                 const lastRemoveButton = newRemainingItems[0].querySelector('.remove-food-btn');
                 if (lastRemoveButton) {
                     lastRemoveButton.style.display = 'none';
                 }
             }


            // Auto-calculate if the setting is enabled
            if (document.getElementById('autoCalculate')?.checked) {
                Calculator.calculate();
            }
        }, 300); // Match timeout to transition duration
    }

    /**
     * Removes a person field section from the DOM.
     * Ensures at least one person field remains.
     * @param {HTMLElement} removeButton - The remove button (could be added per person card).
     */
    static removePersonField(removeButton) {
        console.log("Attempting to remove person field...");
        const personFieldToRemove = removeButton.closest('.person-field');
        const personFieldsContainer = document.getElementById('personFields');

        if (!personFieldToRemove || !personFieldsContainer) {
            console.error("Could not find the person field to remove or the container.");
            UI.showToast("Error removing person.", "error");
            return;
        }

        const existingFields = personFieldsContainer.querySelectorAll('.person-field');

        if (existingFields.length <= 1) {
            console.warn("Cannot remove the last person field.");
            UI.showToast("Cannot remove the only person.", "warning");
            return;
        }

        // Add confirmation dialog?
        // if (!confirm("Are you sure you want to remove this person?")) {
        //     console.log("Person removal cancelled.");
        //     return;
        // }

        // Apply fade-out animation
         personFieldToRemove.style.transition = 'opacity 0.3s ease, transform 0.3s ease, height 0.3s ease';
         personFieldToRemove.style.opacity = '0';
         personFieldToRemove.style.transform = 'translateY(-10px)';
         // Adjust height or margin for smooth collapse
         personFieldToRemove.style.marginTop = '0';
         personFieldToRemove.style.marginBottom = '0';
         personFieldToRemove.style.paddingTop = '0';
         personFieldToRemove.style.paddingBottom = '0';
         personFieldToRemove.style.overflow = 'hidden';
         // Set height to 0 after a delay to allow inner content to fade
         setTimeout(() => {
             personFieldToRemove.style.height = '0';
         }, 150);


        setTimeout(() => {
            const personName = personFieldToRemove.querySelector('.personName h3')?.textContent || 'this person';
            personFieldToRemove.remove();
            console.log("Person field removed successfully.");
            UI.showToast(`${personName} removed.`, "info");
            Person.updatePersonNumbers(); // Renumber remaining people

            // Auto-calculate if the setting is enabled
            if (document.getElementById('autoCalculate')?.checked) {
                Calculator.calculate();
            }
        }, 350); // Match timeout (slightly longer than height animation)
    }

    /**
     * Updates the displayed number for each person field sequentially.
     */
    static updatePersonNumbers() {
        console.log("Updating person numbers...");
        const personFieldsContainer = document.getElementById('personFields');
        if (!personFieldsContainer) return;

        const allPersonFields = personFieldsContainer.querySelectorAll('.person-field');
        allPersonFields.forEach((field, index) => {
            const nameElement = field.querySelector('.personName h3');
            // Only update if the name is in the default "Person X" format
            if (nameElement && nameElement.textContent.startsWith('Person ')) {
                 nameElement.textContent = `Person ${index + 1}`;
            } else if (!nameElement) {
                 console.warn("Could not find name element while renumbering person", index + 1);
            }
        });
        console.log("Person numbers updated.");
    }

    /**
     * Gathers data for a single person from their field.
     * @param {HTMLElement} personField - The person field element.
     * @returns {object} An object containing the person's name and their food items (name and price).
     */
    static getPersonData(personField) {
        const nameElement = personField.querySelector('.personName h3');
        const name = nameElement ? nameElement.textContent.trim() : `Person ${personField.dataset.personIndex || 'Unknown'}`; // Fallback name
        const personId = personField.dataset.personId || null; // Get saved ID if exists

        const foodItems = [];
        const foodItemRows = personField.querySelectorAll('.person-food-list li.food-item-row');

        foodItemRows.forEach(itemRow => {
            const nameInput = itemRow.querySelector('.food-item-name');
            const priceInput = itemRow.querySelector('.food-price');
            const itemName = nameInput ? nameInput.value.trim() : '';
            // Use Utils.parseCurrency to handle different formats potentially
            const itemPrice = priceInput ? Utils.parseCurrency(priceInput.value) : 0;

            // Only add the item if it has a price (and optionally a name, depending on requirements)
            // if (itemPrice > 0) { // Only add items with a price > 0
            if (itemPrice > 0 || itemName) { // Add if either price or name exists
                foodItems.push({ name: itemName || 'Unnamed Item', price: itemPrice });
             } else {
                 console.log("Skipping empty item row for person:", name);
             }
        });

        return { name, id: personId, items: foodItems };
    }

    /**
    * Adds a food item (typically from a scan) directly to a specified person's list.
    * @param {string} personName The name of the person to add the item to.
    * @param {string} itemName The name of the item.
    * @param {number} itemPrice The price of the item.
    * @returns {boolean} True if the item was added successfully, false otherwise.
    */
    static addScannedItemToPerson(personName, itemName, itemPrice) {
        console.log(`Attempting to add scanned item "${itemName}" (${Utils.formatCurrency(itemPrice)}) to ${personName}`);
        const personFieldsContainer = document.getElementById('personFields');
        if (!personFieldsContainer) {
            console.error("Person fields container not found.");
            return false;
        }

        let targetPersonField = null;
        const allPersonFields = personFieldsContainer.querySelectorAll('.person-field');

        allPersonFields.forEach(field => {
            const nameElement = field.querySelector('.personName h3');
            if (nameElement && nameElement.textContent.trim() === personName) {
                targetPersonField = field;
            }
        });

        if (!targetPersonField) {
            console.error(`Person field for "${personName}" not found.`);
            UI.showToast(`Could not find person "${personName}" to add item.`, "error");
            return false;
        }

        const foodList = targetPersonField.querySelector('.person-food-list');
        if (!foodList) {
            console.error(`Food list for "${personName}" not found.`);
            return false;
        }

        // Find the *last* item row in this person's list to use its add button logic
        const itemRows = foodList.querySelectorAll('li.food-item-row');
        const lastItemRow = itemRows[itemRows.length - 1];

        if (!lastItemRow) {
             console.error(`Could not find a template item row for "${personName}".`);
             // Potentially create a basic row manually if none exist?
             return false;
        }

        const lastItemNameInput = lastItemRow.querySelector('.food-item-name');
        const lastItemPriceInput = lastItemRow.querySelector('.food-price');
        const addButton = lastItemRow.querySelector('.add-food-btn');


        // Check if the last row is empty. If yes, fill it. Otherwise, add a new row.
        if (lastItemNameInput && lastItemPriceInput && !lastItemNameInput.value && !lastItemPriceInput.value && itemRows.length > 0) {
            console.log(`Filling empty row for ${personName} with scanned item.`);
            lastItemNameInput.value = itemName;
            lastItemPriceInput.value = itemPrice.toFixed(2); // Ensure 2 decimal places
             // Make remove button visible on this row now it's filled
             const removeButton = lastItemRow.querySelector('.remove-food-btn');
             if (removeButton) removeButton.style.display = 'inline-flex';
        } else if (addButton) {
             console.log(`Adding new row for ${personName} with scanned item.`);
             // Trigger the add button to create a new row first
             Person.addFoodItem(addButton);
             // Now find the newly added row (which should be the last one again)
             const newItemRow = foodList.querySelector('li.food-item-row:last-child');
             if (newItemRow) {
                 const newNameInput = newItemRow.querySelector('.food-item-name');
                 const newPriceInput = newItemRow.querySelector('.food-price');
                 if (newNameInput) newNameInput.value = itemName;
                 if (newPriceInput) newPriceInput.value = itemPrice.toFixed(2);
                 console.log(`Added "${itemName}" for ${personName}`);

             } else {
                 console.error(`Failed to find the newly added row for ${personName}.`);
                 return false;
             }
        } else {
             console.error(`Could not find add button or suitable row to add item for ${personName}.`);
             return false;
        }


        // Trigger calculation if auto-calculate is on
        if (document.getElementById('autoCalculate')?.checked) {
            Calculator.calculate();
        }

        UI.showToast(`Added "${itemName}" to ${personName}.`, "success");
        return true;
    }

}