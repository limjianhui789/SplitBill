// js/scan.js - Handles invoice scanning functionality

class Scan {
    static currentStream = null; // Store the current stream to close it later
    static isInitiating = false; // Flag to prevent concurrent initiations

    /**
     * Initiates the invoice scanning process.
     * Attempts to access the user's camera and displays it in the modal.
     */
    static async initiateScan() {
        if (Scan.isInitiating) {
            console.log("Scan initiation already in progress. Ignoring concurrent request.");
            return;
        }
        Scan.isInitiating = true;
        console.log("Initiating invoice scan...");

        const scanModal = document.getElementById('scanModal');
        const videoElement = document.getElementById('cameraFeed');
        const captureBtn = document.getElementById('captureScanBtn');
        const uploadBtn = document.getElementById('uploadImageBtn');
        const fileInput = document.getElementById('imageFileInput');
        const closeBtn = document.getElementById('closeScanModalBtn');
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        // Clean up function to reset the flag and potentially hide modal
        const cleanup = (hideModal = true) => {
            Scan.isInitiating = false;
            if (hideModal && scanModal) {
                scanModal.classList.add('hidden'); // Ensure modal is hidden on failure/early exit
            }
             if (loadingOverlay) {
                 loadingOverlay.classList.add('hidden'); // Ensure loading is hidden
             }
        };

        if (!scanModal || !videoElement || !captureBtn || !uploadBtn || !fileInput || !closeBtn || !loadingOverlay) {
            console.error("Scan modal elements not found in the DOM.");
            UI.showToast("Scan interface failed to load.", "error");
            cleanup(false); // Don't hide modal if it wasn't even found
            return;
        }

        // Hide loading overlay initially
        loadingOverlay.classList.add('hidden');

        // Check for mediaDevices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Browser API navigator.mediaDevices.getUserMedia not available");
            UI.showToast("Camera access is not supported by your browser. You can still upload images.", "warning");

            // Setup upload functionality even if camera is not available
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => Scan.handleImageUpload(e);
            closeBtn.onclick = () => Scan.closeCameraStream();

            // Show the modal without camera
            videoElement.style.display = 'none';
            scanModal.classList.remove('hidden');
            Scan.isInitiating = false;
            return;
        }

        // Ensure any previous stream is stopped before starting a new one
        if (Scan.currentStream) {
            console.warn("Previous stream detected. Stopping it before initiating new scan.");
            Scan.closeCameraStream(false); // Close stream without hiding modal yet
        }

        try {
            // Request access to the camera (rear camera preferred)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment" // Prefer the rear camera
                },
                audio: false
            });

            Scan.currentStream = stream; // Store the stream

            console.log("Camera access granted.");
            UI.showToast("Camera activated. Point at the invoice.", "info");

            // Assign event listeners (ensure they aren't duplicated if re-opening)
            // Use .onclick to ensure only one listener is present
            captureBtn.onclick = () => Scan.captureImage(videoElement); // Pass only video element
            uploadBtn.onclick = () => fileInput.click(); // Trigger file input click
            fileInput.onchange = (e) => Scan.handleImageUpload(e); // Handle file selection
            closeBtn.onclick = () => Scan.closeCameraStream(); // Close uses stored stream

            // Display the camera stream in the existing modal elements
            videoElement.srcObject = stream;
            // Reset video state before playing
            videoElement.pause();
            videoElement.currentTime = 0;

            // Show the modal *before* playing video might help context
             scanModal.classList.remove('hidden');

            // Ensure video plays on mobile Safari etc.
            await videoElement.play();
            console.log("Video playback started successfully.");
            // Scan.isInitiating = false; // Set flag to false only after successful play starts

             // Set flag to false *after* modal is shown and video starts playing
             Scan.isInitiating = false;


        } catch (err) {
            console.error("Error during scan initiation:", err);
            Scan.currentStream = null; // Clear stream ref on error

            let message = "Could not access camera. You can still upload images.";
            if (err.name === "NotAllowedError") {
                message = "Camera access permission was denied. You can still upload images.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                message = "No camera found on this device. You can still upload images.";
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                message = "Camera might be already in use by another application. You can still upload images.";
            } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
                message = "Could not satisfy camera constraints. You can still upload images.";
            } else if (err.name === "AbortError") {
                 message = "Camera start was interrupted. You can still upload images.";
                 console.warn("Video play() was aborted, likely by a new request or closing the modal early.");
            } else {
                 message = `Camera error: ${err.name}. You can still upload images.`;
            }

            UI.showToast(message, "warning");

            // Setup upload functionality even if camera access fails
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => Scan.handleImageUpload(e);
            closeBtn.onclick = () => Scan.closeCameraStream();

            // Show the modal without camera
            videoElement.style.display = 'none';
            scanModal.classList.remove('hidden');
            Scan.isInitiating = false;
        }
        // Note: We no longer set Scan.isInitiating = false here, it's handled in success/error paths
    }

    /**
     * Stops the camera stream tracks and hides the modal.
     * @param {boolean} hideModal - Whether to hide the modal (default: true).
     */
    static closeCameraStream(hideModal = true) {
        const scanModal = document.getElementById('scanModal');
        const videoElement = document.getElementById('cameraFeed');
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        console.log("Attempting to close camera stream...");

        if (Scan.currentStream) {
            Scan.currentStream.getTracks().forEach(track => {
                track.stop();
                console.log(`Track stopped: ${track.kind} (${track.label})`);
            });
            Scan.currentStream = null; // Clear the stored stream
             console.log("All tracks stopped, currentStream set to null.");
        } else {
             console.log("No active stream found to stop.");
        }

        if (videoElement) {
            videoElement.pause(); // Pause video
            videoElement.srcObject = null; // Release the stream reference
            videoElement.style.display = ''; // Reset display style in case it was hidden
            console.log("Video element paused and srcObject set to null.");
        }

        if (hideModal && scanModal) {
            scanModal.classList.add('hidden');
            console.log("Scan modal hidden.");
        }
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden'); // Ensure loading is hidden when closing
        }

        // Reset file input if it exists
        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) {
            fileInput.value = ''; // Clear any selected file
        }

         // Reset the initiation flag if the stream is closed.
         Scan.isInitiating = false;
         console.log("Scan initiation flag reset.");
    }


    /**
     * Captures an image from the video stream.
     * @param {HTMLVideoElement} videoElement The video element showing the stream.
     */
    static captureImage(videoElement) {
        console.log("Capturing image...");
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        if (!videoElement.srcObject || !videoElement.videoWidth || !videoElement.videoHeight || videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
            console.error("Video dimensions are zero or video not ready, cannot capture.", {
                width: videoElement.videoWidth,
                height: videoElement.videoHeight,
                readyState: videoElement.readyState,
                srcObject: !!videoElement.srcObject
            });
            UI.showToast("Error capturing image: Camera feed not ready.", "error");
             if (loadingOverlay) loadingOverlay.classList.add('hidden'); // Hide loading on error
            return;
        }

         if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden'); // Show loading spinner
         }

        const canvas = document.createElement('canvas');
        // Set canvas dimensions based on video feed dimensions for best quality
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const context = canvas.getContext('2d');
        // Draw the current video frame onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Get the image data from the canvas as a Blob
         canvas.toBlob(blob => {
            if (blob) {
                console.log(`Image captured as Blob, size: ${blob.size} bytes, type: ${blob.type}`);
                // Send this blob to the Gemini API
                // We intentionally don't close the stream here, sendToGeminiAPI will handle it
                Scan.sendToGeminiAPI(blob); // Handles hiding overlay on completion/error
            } else {
                console.error("Failed to create Blob from canvas.");
                 UI.showToast("Failed to capture image data.", "error");
                 if (loadingOverlay) loadingOverlay.classList.add('hidden'); // Hide loading on error
                 Scan.closeCameraStream(); // Close stream if capture fails to create blob
            }
         }, 'image/jpeg', 0.9); // Use JPEG for potentially smaller size, quality 0.9
    }

     /**
      * Sends the captured image data to the Gemini API.
      * @param {Blob} imageBlob The captured image data as a Blob.
      */
     static async sendToGeminiAPI(imageBlob) {
         console.log("Sending image to Gemini API...");
         // Note: Loading overlay is already shown by captureImage
         const loadingOverlay = document.getElementById('scanLoadingOverlay');

         // --- Placeholder for actual API call ---
         // IMPORTANT: Replace "YOUR_GEMINI_API_KEY" with a secure method
         // of retrieving your API key (e.g., from a config file, backend proxy).
         const apiKey = "AIzaSyAa0qV2hBkflFh0rSg2jmUQTL_W6bJcEc0"; // <<< REPLACE THIS >>>
         const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"; // Updated model

         if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
             console.error("Gemini API Key not configured.");
             UI.showToast("Scan feature not configured. API key missing.", "error");
             if (loadingOverlay) loadingOverlay.classList.add('hidden');
             Scan.closeCameraStream(); // Close the camera if API key is missing
             return;
         }

         // Convert Blob to Base64 for JSON payload
         const reader = new FileReader();
         reader.readAsDataURL(imageBlob);
         reader.onloadend = async () => {
             const base64Data = reader.result.split(',')[1]; // Remove the "data:image/jpeg;base64," prefix

             const requestBody = {
                 contents: [{
                     parts: [{
                         // Updated prompt for better structure and clarity
                         text: `Analyze this invoice image. Extract line items, including description and total price for each item. Also extract the overall tax amount and the final grand total. Structure the output as a JSON object with keys: "lineItems" (an array of objects, each with "description" and "price" as a number), "tax" (a number), and "grandTotal" (a number). If a value isn't found, represent it as null. Example: { "lineItems": [{"description": "Burger", "price": 12.50}, {"description": "Fries", "price": 4.00}], "tax": 1.32, "grandTotal": 17.82 }`
                     }, {
                         inline_data: {
                             mime_type: imageBlob.type, // e.g., "image/jpeg"
                             data: base64Data
                         }
                     }]
                 }],
                 generationConfig: {
                    // Request JSON output directly if the model supports it reliably
                    // Note: For gemini-pro-vision, this might not be directly supported in generationConfig.
                    // The model usually outputs JSON within the text part if prompted correctly.
                    // "response_mime_type": "application/json", // Remove if not supported by vision model
                 }
             };

             try {
                 const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json'
                     },
                     body: JSON.stringify(requestBody)
                 });

                  // Regardless of ok status, hide loading and close camera stream now
                  // Do this *after* getting response but before processing it.
                  if (loadingOverlay) loadingOverlay.classList.add('hidden');
                  Scan.closeCameraStream();
                  console.log("Stream closed and loading hidden after API response received.");


                 if (!response.ok) {
                     let errorMsg = 'Unknown API error';
                     let errorData = null;
                     try {
                         errorData = await response.json();
                         console.error("Gemini API Error Response:", errorData);
                         errorMsg = errorData?.error?.message || `Status ${response.status}`;
                     } catch (e) {
                         // If parsing JSON fails, try reading as text
                         const textResponse = await response.text();
                         console.error("Could not parse API error response as JSON:", textResponse);
                         errorMsg = `Status ${response.status} - ${textResponse.substring(0, 100)}`;
                     }
                      // Re-throw a more informative error
                     throw new Error(`API Error: ${errorMsg}`);
                 }

                 const data = await response.json();
                 console.log("Gemini API Success Response:", data);

                 // Process the response and show the review modal
                 Scan.processGeminiResponse(data);

             } catch (error) {
                 console.error("Error calling or processing Gemini API response:", error);
                 // Ensure UI reflects the error state properly
                  UI.showToast(`Failed to process invoice: ${error.message}`, "error");
                  // Ensure loading is hidden and stream closed on error (redundant check, but safe)
                  if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) loadingOverlay.classList.add('hidden');
                  if (Scan.currentStream) Scan.closeCameraStream(); // Ensure closure if error happened before response handling
             }
         };
         reader.onerror = (error) => {
             console.error("Error converting Blob to Base64:", error);
             UI.showToast("Failed to prepare image for scanning.", "error");
             if (loadingOverlay) loadingOverlay.classList.add('hidden');
             Scan.closeCameraStream();
         };
     }

     /**
      * Gets the current list of person names from the main UI.
      * @returns {string[]} An array of person names.
      */
     static getCurrentPersonNames() {
         const personFieldsContainer = document.getElementById('personFields');
         if (!personFieldsContainer) return [];

         const names = [];
         const personFields = personFieldsContainer.querySelectorAll('.person-field');
         personFields.forEach(field => {
             const nameElement = field.querySelector('.personName h3');
             if (nameElement) {
                 names.push(nameElement.textContent.trim());
             }
         });
         return names;
     }


    /**
      * Processes the response from the Gemini API.
      * Extracts item data and populates the review modal with assignment options.
      * @param {object} responseData The response object from the Gemini API.
      */
     static processGeminiResponse(responseData) {
         console.log("Processing Gemini response for review...");
         const reviewModal = document.getElementById('scanReviewModal');
         const reviewListContainer = document.getElementById('scanReviewListContainer');
         const scannedTotalEl = document.getElementById('scannedTotalAmount');
         const finishReviewBtn = document.getElementById('finishReviewBtn');
         const closeReviewBtn = document.getElementById('closeReviewModalBtn');

         if (!reviewModal || !reviewListContainer || !scannedTotalEl || !finishReviewBtn || !closeReviewBtn) {
             console.error("Review modal elements not found.");
             UI.showToast("Failed to display scanned items.", "error");
             return;
         }

         try {
             // Adjusted extraction for gemini-pro-vision response structure
             const generatedContent = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
             let invoiceData;

              if (!generatedContent) {
                   // Check for safety ratings or blocked responses more robustly
                   const blockReason = responseData?.promptFeedback?.blockReason;
                   if (blockReason) {
                       console.warn(`Content blocked by API: ${blockReason}`);
                       throw new Error(`Invoice processing blocked (${blockReason}).`);
                   }
                   const finishReason = responseData?.candidates?.[0]?.finishReason;
                   if (finishReason && finishReason !== "STOP") {
                       console.warn(`Generation finished unexpectedly: ${finishReason}`, responseData?.candidates?.[0]?.safetyRatings);
                       const safetyReason = responseData?.candidates?.[0]?.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ');
                       throw new Error(`Invoice processing issue (${finishReason}${safetyReason ? ' - Safety: ' + safetyReason : ''}).`);
                   }
                  console.error("No text content found in Gemini response structure:", JSON.stringify(responseData, null, 2));
                  throw new Error("No invoice details generated by the API.");
              }

             try {
                  // The text part should contain the JSON string.
                  // It might be wrapped in markdown ```json ... ```, try to extract it.
                  const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
                  const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
                  invoiceData = JSON.parse(jsonString);
             } catch (parseError) {
                  console.error("Failed to parse Gemini response text as JSON:", parseError, "\nRaw Content:", generatedContent);
                 throw new Error("Could not understand the invoice details format.");
             }

             console.log("Parsed Invoice Data:", invoiceData);

             // --- Populate Review Modal ---
             reviewListContainer.innerHTML = ''; // Clear previous items
             let itemsAddedCount = 0;
             let runningTotal = 0;
             const currentPersonNames = Scan.getCurrentPersonNames(); // Get names for dropdown

             if (invoiceData && Array.isArray(invoiceData.lineItems) && invoiceData.lineItems.length > 0) {
                 invoiceData.lineItems.forEach((item, index) => {
                     const description = item.description || `Scanned Item ${index + 1}`;
                     // Ensure price is treated as number, handle potential null/string values
                     const price = (item.price === null || item.price === undefined) ? NaN : parseFloat(item.price);

                     // Skip items with invalid or missing prices for assignment? Or assign price 0?
                     if (isNaN(price)) {
                         console.warn(`Invalid or missing price for item: ${description}`, item.price);
                         // Decide whether to skip or default price to 0
                         // return; // Option 1: Skip this item entirely
                         // price = 0; // Option 2: Treat price as 0
                     }

                     const priceValue = !isNaN(price) ? price : 0; // Use 0 if price is invalid/missing for calculation
                     runningTotal += priceValue;
                     itemsAddedCount++;

                     // Create list item element for review with assignment dropdown
                     const li = document.createElement('div');
                     li.className = 'scan-review-item flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md mb-2 gap-2'; // Added margin-bottom
                     // Store original data attributes for reference if needed, but primary source will be input fields
                     li.dataset.originalDescription = description;
                     li.dataset.originalPrice = priceValue.toFixed(2);

                     // Create dropdown options
                     let optionsHTML = `<option value="ignore">Ignore</option>`; // Default: Ignore
                     currentPersonNames.forEach(name => {
                         optionsHTML += `<option value="${Utils.escapeHTML(name)}">${Utils.escapeHTML(name)}</option>`;
                     });
                     optionsHTML += `<option value="additional_fee">Add to Additional Fee</option>`;
                     // Optionally add Tax option: optionsHTML += `<option value="tax">Set as Tax (%)</option>`;

                     li.innerHTML = `
                         <div class="flex-grow mr-2 mb-2 sm:mb-0 space-y-1">
                           <input type="text" class="review-item-name w-full text-sm border rounded-md px-2 py-1 dark:bg-dark-input dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-accent-purple focus:border-transparent" value="${Utils.escapeHTML(description)}">
                           <input type="text" inputmode="decimal" class="review-item-price w-full text-xs font-semibold border rounded-md px-2 py-1 dark:bg-dark-input dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-accent-purple focus:border-transparent" value="${priceValue.toFixed(2)}" oninput="Utils.handleCalculatorInput(this)">
                         </div>
                         <div class="w-full sm:w-auto">
                           <select class="item-assignment-select w-full sm:w-48 px-2 py-1 text-sm border rounded-md dark:bg-dark-input dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-accent-purple focus:border-transparent">
                             ${optionsHTML}
                           </select>
                         </div>
                     `;
                     reviewListContainer.appendChild(li);
                 });
             }

             if (itemsAddedCount === 0) {
                  reviewListContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">No assignable line items found on the invoice.</p>';
             }

             // Update total amount display (use grandTotal from API if available and valid, otherwise sum of items)
             const grandTotal = (invoiceData.grandTotal === null || invoiceData.grandTotal === undefined) ? NaN : parseFloat(invoiceData.grandTotal);
             const displayTotal = !isNaN(grandTotal) ? grandTotal : runningTotal;
             scannedTotalEl.textContent = Utils.formatCurrency(displayTotal);

             // Store tax if available and valid for potential pre-filling (but don't assign via dropdown for now)
             const tax = (invoiceData.tax === null || invoiceData.tax === undefined) ? NaN : parseFloat(invoiceData.tax);
             const taxInput = document.getElementById('taxInput');
             if (taxInput && !isNaN(tax)) {
                 // Convert tax amount to percentage if needed, assuming API gives amount
                 // This logic might need adjustment based on actual invoice data and requirements
                 // For now, let's just store it for now.
                 reviewModal.dataset.scannedTax = tax.toFixed(2);
                 console.log("Scanned tax amount stored:", tax.toFixed(2));
             } else {
                 reviewModal.dataset.scannedTax = 'null';
             }


             // --- Setup Review Modal Buttons ---
             finishReviewBtn.onclick = () => {
                 Scan.assignReviewedItems(); // Call the new assignment function
                 reviewModal.classList.add('hidden');
                 // UI Toast handled within assignReviewedItems
             };
             closeReviewBtn.onclick = () => reviewModal.classList.add('hidden');

             reviewModal.classList.remove('hidden'); // Show the review modal

             UI.showToast(`${itemsAddedCount} item(s) extracted. Please review and assign.`, itemsAddedCount > 0 ? "success" : "warning");


         } catch (error) {
             console.error("Error processing Gemini response:", error);
             UI.showToast(`Error processing invoice data: ${error.message}`, "error");
             // Ensure review modal is hidden if processing fails
             if (reviewModal && !reviewModal.classList.contains('hidden')) {
                 reviewModal.classList.add('hidden');
             }
         }
     }

     /**
      * Processes the assignments made in the review modal and updates the main bill.
      */
     static assignReviewedItems() {
         console.log("Assigning reviewed items...");
         const reviewListContainer = document.getElementById('scanReviewListContainer');
         const reviewItems = reviewListContainer.querySelectorAll('.scan-review-item');
         const additionalFeeInput = document.getElementById('additionalFeeInput');
         // const taxInput = document.getElementById('taxInput'); // If assigning tax

         if (!additionalFeeInput) {
             console.error("Additional Fee input not found.");
             UI.showToast("Error applying assignments.", "error");
             return;
         }

         let assignedCount = 0;
         let feeAdded = 0;
         let errors = 0;

         reviewItems.forEach(item => {
             // Get values from the input fields now
             const nameInput = item.querySelector('.review-item-name');
             const priceInput = item.querySelector('.review-item-price');
             const selectElement = item.querySelector('.item-assignment-select');

             if (!nameInput || !priceInput || !selectElement) {
                 console.warn("Skipping item due to missing input/select elements.", item);
                 errors++;
                 return;
             }

             const description = nameInput.value.trim();
             const price = Utils.parseCurrency(priceInput.value); // Use parseCurrency to handle potential formatting
             const selectedValue = selectElement.value;

             if (isNaN(price)) {
                 console.warn(`Skipping item "${description}" due to invalid price: ${priceInput.value}`);
                 errors++;
                 // Optionally notify user about skipped item
                 // UI.showToast(`Skipped item "${description}" due to invalid price.`, "warning");
                 return; // Skip items with invalid prices
             }

             if (!description) {
                console.warn(`Skipping item with empty description and price ${price}.`);
                errors++;
                 // Optionally notify user about skipped item
                // UI.showToast(`Skipped item with empty description.`, "warning");
                return; // Skip items with empty descriptions
             }

             console.log(`Processing assignment for "${description}" (${price}): Target = ${selectedValue}`);

             if (selectedValue === 'ignore') {
                 // Do nothing
             } else if (selectedValue === 'additional_fee') {
                 try {
                     const currentFee = Utils.parseCurrency(additionalFeeInput.value);
                     const newFee = currentFee + price;
                     additionalFeeInput.value = newFee.toFixed(2); // Keep 2 decimal places
                     feeAdded += price;
                     assignedCount++;
                 } catch (e) {
                     console.error("Error updating additional fee:", e);
                     errors++;
                 }
             } else {
                 // Assign to a person
                 const personName = selectedValue;
                 const success = Person.addScannedItemToPerson(personName, description, price);
                 if (success) {
                     assignedCount++;
                 } else {
                     errors++;
                     // Error toast is shown within addScannedItemToPerson
                 }
             }
         });

         console.log(`Finished assigning items. Assigned: ${assignedCount}, Errors: ${errors}, Added to Fee: ${Utils.formatCurrency(feeAdded)}`);

         // Update UI / show summary toast
         let message = "Assignments complete. ";
         if (assignedCount > 0) message += `${assignedCount} item(s) assigned. `;
         if (feeAdded > 0) message += `${Utils.formatCurrency(feeAdded)} added to fees. `;
         if (errors > 0) message += `${errors} assignment(s) failed or were skipped.`;

         UI.showToast(message.trim(), errors > 0 ? "warning" : "success");

         // Optionally prefill tax from stored value?
         const reviewModal = document.getElementById('scanReviewModal');
         const storedTax = reviewModal?.dataset.scannedTax;
         const taxInput = document.getElementById('taxInput');
         if(taxInput && storedTax && storedTax !== 'null' && !taxInput.value) {
              // This is tricky - API gives tax AMOUNT, input expects PERCENTAGE.
              // We need the subtotal BEFORE tax to calculate the percentage accurately.
              // For now, maybe just log it or show in a separate message.
              console.warn(`Scanned tax amount was ${Utils.formatCurrency(parseFloat(storedTax))}. Manual entry required for percentage.`);
              // Or potentially add it as an additional fee if that makes sense?
              // UI.showToast(`Note: Scanned tax amount was ${Utils.formatCurrency(parseFloat(storedTax))}. Please enter tax % manually.`, "info");
         }


         // Trigger calculation if auto-calculate is on
         if (document.getElementById('autoCalculate')?.checked) {
             Calculator.calculate();
         }
     }


    /**
     * Handles image upload from the gallery.
     * @param {Event} event The file input change event.
     */
    static handleImageUpload(event) {
        console.log("Handling image upload...");
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        if (!event.target.files || event.target.files.length === 0) {
            console.warn("No file selected for upload.");
            return;
        }

        const file = event.target.files[0];

        // Check if the file is an image
        if (!file.type.match('image.*')) {
            console.error("Selected file is not an image.");
            UI.showToast("Please select an image file.", "error");
            return;
        }

        // Show loading overlay
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        // Process the image file
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create a canvas to draw the image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert canvas to blob
                canvas.toBlob(blob => {
                    if (blob) {
                        console.log(`Uploaded image processed as Blob, size: ${blob.size} bytes, type: ${blob.type}`);
                        // Send the blob to the Gemini API using the existing method
                        Scan.sendToGeminiAPI(blob);
                    } else {
                        console.error("Failed to create Blob from uploaded image.");
                        UI.showToast("Failed to process uploaded image.", "error");
                        if (loadingOverlay) loadingOverlay.classList.add('hidden');
                    }
                }, 'image/jpeg', 0.9);
            };

            img.onerror = () => {
                console.error("Error loading the uploaded image.");
                UI.showToast("Failed to load the uploaded image.", "error");
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            console.error("Error reading the uploaded file.");
            UI.showToast("Failed to read the uploaded file.", "error");
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        };

        reader.readAsDataURL(file);

        // Reset the file input so the same file can be selected again if needed
        event.target.value = '';
    }

} // ========= End of Scan Class =========

// Note: Event listener setup for the main scan button is handled in ui.js
// The check in ui.js ensures `Scan.initiateScan()` is called correctly.