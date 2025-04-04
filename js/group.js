// Group management functionality for SplitInvoice

const Group = {
  // Open group modal
  openGroupModal: function() {
    // Open the group modal
    const modal = document.getElementById('groupModal');
    modal.classList.remove('hidden');

    // Update the group people list
    const groupPeopleList = document.getElementById('groupPeopleList');
    groupPeopleList.innerHTML = '';

    const personFields = document.getElementsByClassName("person-field");
    for (let i = 0; i < personFields.length; i++) {
      const personName = personFields[i].querySelector("h3").textContent;
      const personDiv = document.createElement('div');
      personDiv.className = 'mb-1 p-2 bg-white dark:bg-gray-600 rounded';
      personDiv.textContent = personName;
      groupPeopleList.appendChild(personDiv);
    }
  },

  // Close group modal
  closeGroupModal: function() {
    document.getElementById('groupModal').classList.add('hidden');
  },

  // Save a group
  saveGroup: function() {
    const groupName = document.getElementById('groupNameInput').value.trim();

    if (!groupName) {
      Utils.showToast('Please enter a group name', 'error');
      return;
    }

    // Get people names from current bill
    const peopleNames = [];
    const personFields = document.getElementsByClassName("person-field");

    for (let i = 0; i < personFields.length; i++) {
      const personName = personFields[i].querySelector("h3").textContent;
      peopleNames.push(personName);
    }

    // Create group object
    const group = {
      id: Date.now().toString(),
      name: groupName,
      people: peopleNames
    };

    // Get existing groups
    let groups = JSON.parse(localStorage.getItem('savedGroups')) || [];
    groups.push(group);

    // Save updated groups
    localStorage.setItem('savedGroups', JSON.stringify(groups));

    // Close modal
    this.closeGroupModal();

    // Show toast notification
    Utils.showToast('Group saved successfully!', 'success');
  },

  // Load a group
  loadGroup: function(groupId) {
    const groups = JSON.parse(localStorage.getItem('savedGroups')) || [];
    const group = groups.find(g => g.id === groupId);

    if (!group) {
      Utils.showToast('Group not found', 'error');
      return;
    }

    // Clear existing people
    document.getElementById('personFields').innerHTML = '';

    // Add people from group
    for (const personName of group.people) {
      Person.addPersonField();

      // Get the last added person field
      const personFields = document.getElementsByClassName("person-field");
      const personField = personFields[personFields.length - 1];

      // Set person name if personField exists
      if (personField) {
        const nameElement = personField.querySelector(".personName h3");
        if (nameElement) {
          nameElement.textContent = personName;
        } else {
          console.warn(`Could not find name element for person: ${personName}`);
          // Try to create the name element if it doesn't exist
          const personNameDiv = personField.querySelector('.personName');
          if (personNameDiv) {
            const h3 = document.createElement('h3');
            h3.contentEditable = 'true';
            h3.className = 'outline-none';
            h3.textContent = personName;
            personNameDiv.appendChild(h3);
          }
        }
      } else {
        console.error(`Could not find person field for: ${personName}`);
      }
    }

    Template.closeTemplateModal();
    Utils.showToast('Group loaded successfully!', 'success');
  }
};