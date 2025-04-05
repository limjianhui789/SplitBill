// js/scan.js - Handles invoice scanning functionality

// Global variable to store the last image blob for re-scanning
// This ensures it persists even if the class property is cleared
let globalLastImageBlob = null;

// Import config (will be available after build process)
let Config;
try {
    // Try to import the config module
    import('./config.js')
        .then(module => {
            Config = module.default;
        })
        .catch(error => {
            console.error('Error loading config module:', error);
            // Fallback to default values
            Config = {
                GEMINI_API_KEY: "AIzaSyAa0qV2hBkflFh0rSg2jmUQTL_W6bJcEc0",
                GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
            };
        });
} catch (error) {
    console.error('Error importing config module:', error);
    // Fallback to default values
    Config = {
        GEMINI_API_KEY: "AIzaSyAa0qV2hBkflFh0rSg2jmUQTL_W6bJcEc0",
        GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    };
}

class Scan {
    static currentStream = null; // Store the current stream to close it later
    static isInitiating = false; // Flag to prevent concurrent initiations
    static lastImageBlob = null; // Store the last captured/uploaded image for re-scanning

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
     * @param {boolean} preserveImageBlob - Whether to preserve the lastImageBlob (default: false).
     */
    static closeCameraStream(hideModal = true, preserveImageBlob = false) {
        const scanModal = document.getElementById('scanModal');
        const videoElement = document.getElementById('cameraFeed');
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        console.log(`Attempting to close camera stream... hideModal=${hideModal}, preserveImageBlob=${preserveImageBlob}`);
        console.log(`Current lastImageBlob: ${Scan.lastImageBlob ? `Size: ${Scan.lastImageBlob.size} bytes, type: ${Scan.lastImageBlob.type}` : 'No image blob'}`);

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

         // Clear the last image blob when closing the scan modal, unless preserveImageBlob is true
         if (!preserveImageBlob) {
             console.log("Clearing lastImageBlob...");
             Scan.lastImageBlob = null;
             // Note: We intentionally don't clear globalLastImageBlob here
             // This ensures we always have a copy for re-scanning
             console.log("Scan initiation flag reset and class lastImageBlob cleared. Global copy preserved.");
         } else {
             console.log("Preserving lastImageBlob for re-scanning:", Scan.lastImageBlob ? `Size: ${Scan.lastImageBlob.size} bytes` : 'No image blob');
             console.log("Scan initiation flag reset. Last image preserved for re-scanning.");
         }
    }


    /**
     * Captures an image from the video stream.
     * @param {HTMLVideoElement} videoElement The video element showing the stream.
     * @returns {Promise<void>} A promise that resolves when the image is captured and processed.
     */
    static captureImage(videoElement) {
        console.log("Capturing image...");
        return new Promise((resolve, reject) => {
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
                reject(new Error("Camera feed not ready"));
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
                    // Store the blob for potential re-scanning in both class property and global variable
                    Scan.lastImageBlob = blob;
                    globalLastImageBlob = blob; // Store in global variable as well
                    console.log(`Image captured and stored for re-scanning. Blob size: ${blob.size} bytes, type: ${blob.type}`);
                    // Send this blob to the Gemini API
                    // We intentionally don't close the stream here, sendToGeminiAPI will handle it
                    Scan.sendToGeminiAPI(blob) // Handles hiding overlay on completion/error
                        .then(() => resolve())
                        .catch(error => reject(error));
                } else {
                    console.error("Failed to create Blob from canvas.");
                    UI.showToast("Failed to capture image data.", "error");
                    if (loadingOverlay) loadingOverlay.classList.add('hidden'); // Hide loading on error
                    Scan.closeCameraStream(); // Close stream if capture fails to create blob
                    reject(new Error("Failed to create image data"));
                }
            }, 'image/jpeg', 0.9); // Use JPEG for potentially smaller size, quality 0.9
        });
    }

     /**
      * Sends the captured image data to the Gemini API.
      * @param {Blob} imageBlob The captured image data as a Blob.
      * @param {boolean} isRescanning Whether this is a re-scan operation (default: false).
      * @returns {Promise<void>} A promise that resolves when the API call is complete.
      */
     static sendToGeminiAPI(imageBlob, isRescanning = false) {
         console.log(`Sending image to Gemini API... ${isRescanning ? '(RE-SCANNING)' : '(INITIAL SCAN)'} - Blob size: ${imageBlob.size} bytes, type: ${imageBlob.type}`);
         // Note: Loading overlay is already shown by captureImage or uploadImage
         const loadingOverlay = document.getElementById('scanLoadingOverlay');

         return new Promise((resolve, reject) => {
             // Get API settings from Config
             const apiKey = Config?.GEMINI_API_KEY || "AIzaSyAa0qV2hBkflFh0rSg2jmUQTL_W6bJcEc0"; // Fallback to default if Config not loaded yet
             const apiUrl = Config?.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"; // Fallback to default

             if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
                 console.error("Gemini API Key not configured.");
                 UI.showToast("Scan feature not configured. API key missing.", "error");
                 if (loadingOverlay) loadingOverlay.classList.add('hidden');
                 Scan.closeCameraStream(); // Close the camera if API key is missing
                 reject(new Error("API key not configured"));
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

                      // Always preserve the lastImageBlob for potential re-scanning
                      // This is the key fix - we always want to preserve the image blob after scanning
                      // Close camera stream but preserve the image blob
                      Scan.closeCameraStream(true, true); // hideModal=true, preserveImageBlob=true
                      console.log(isRescanning ?
                          "Scan modal hidden after re-scan response received. Image blob preserved." :
                          "Stream closed and loading hidden after API response received. Image blob preserved for potential re-scanning.");


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
                     resolve(); // Resolve the promise when processing is complete

                 } catch (error) {
                     console.error("Error calling or processing Gemini API response:", error);
                     // Ensure UI reflects the error state properly
                      UI.showToast(`Failed to process invoice: ${error.message}`, "error");
                      // Ensure loading is hidden and stream closed on error (redundant check, but safe)
                      if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) loadingOverlay.classList.add('hidden');

                      // Always preserve the lastImageBlob for potential re-scanning, even on error
                      // Close camera stream but preserve the image blob
                      Scan.closeCameraStream(true, true); // hideModal=true, preserveImageBlob=true
                      console.log("Error occurred, but image blob preserved for potential re-scanning.");
                      reject(error); // Reject the promise with the error
                 }
             };
             reader.onerror = (error) => {
                 console.error("Error converting Blob to Base64:", error);
                 UI.showToast("Failed to prepare image for scanning.", "error");
                 if (loadingOverlay) loadingOverlay.classList.add('hidden');

                 // Always preserve the lastImageBlob for potential re-scanning, even on error
                 // Close camera stream but preserve the image blob
                 Scan.closeCameraStream(true, true); // hideModal=true, preserveImageBlob=true
                 console.log("FileReader error occurred, but image blob preserved for potential re-scanning.");

                 reject(new Error("Failed to prepare image for scanning")); // Reject the promise with the error
             };
         });
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

             // Setup re-scan button
             const rescanBtn = document.getElementById('rescanBtn');
             console.log('Setting up re-scan button:', rescanBtn ? 'Button found' : 'Button NOT found',
                'lastImageBlob:', Scan.lastImageBlob ? `Size: ${Scan.lastImageBlob.size} bytes` : 'No image blob',
                'globalLastImageBlob:', globalLastImageBlob ? `Size: ${globalLastImageBlob.size} bytes` : 'No global image blob');

             // Use the global variable as a fallback if the class property is null
             if (!Scan.lastImageBlob && globalLastImageBlob) {
                 console.log("Class lastImageBlob is null, but globalLastImageBlob is available. Using global copy for button setup.");
                 Scan.lastImageBlob = globalLastImageBlob;
             }

             if (rescanBtn) {
                 // Only enable the re-scan button if we have a stored image
                 if (Scan.lastImageBlob) {
                     console.log('Enabling re-scan button');
                     rescanBtn.disabled = false;
                     rescanBtn.classList.remove('opacity-50', 'cursor-not-allowed');

                     // Remove any existing event listeners by cloning and replacing the button
                     const newRescanBtn = rescanBtn.cloneNode(true);
                     rescanBtn.parentNode.replaceChild(newRescanBtn, rescanBtn);

                     // Add a single click handler to the new button
                     newRescanBtn.onclick = function() {
                         console.log('Re-scan button clicked');
                         Scan.rescanImage();
                     };

                     console.log('Re-scan button event handlers attached');
                 } else {
                     console.log('Disabling re-scan button - no image blob available');
                     rescanBtn.disabled = true;
                     rescanBtn.classList.add('opacity-50', 'cursor-not-allowed');
                 }
             }

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

        if (!event.target.files || event.target.files.length === 0) {
            console.warn("No file selected for upload.");
            return;
        }

        const file = event.target.files[0];
        Scan.uploadImage(file);

        // Reset the file input so the same file can be selected again if needed
        event.target.value = '';
    }

    /**
     * Processes an image file uploaded from the gallery.
     * @param {File} file The image file to process.
     * @returns {Promise<void>} A promise that resolves when the image is processed.
     */
    static async uploadImage(file) {
        console.log("Processing uploaded image...");
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

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

        try {
            // Process the image file
            const blob = await Scan.fileToBlob(file);
            if (blob) {
                console.log(`Uploaded image processed as Blob, size: ${blob.size} bytes, type: ${blob.type}`);
                // Store the blob for potential re-scanning in both class property and global variable
                Scan.lastImageBlob = blob;
                globalLastImageBlob = blob; // Store in global variable as well
                console.log(`Uploaded image stored for re-scanning. Blob size: ${blob.size} bytes, type: ${blob.type}`);
                // Send the blob to the Gemini API using the existing method
                Scan.sendToGeminiAPI(blob);
            } else {
                throw new Error("Failed to create Blob from uploaded image.");
            }
        } catch (error) {
            console.error("Error processing uploaded image:", error);
            UI.showToast(error.message || "Failed to process uploaded image.", "error");
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Converts a File object to a Blob using canvas.
     * @param {File} file The file to convert.
     * @returns {Promise<Blob>} A promise that resolves with the Blob.
     * @private
     */
    static fileToBlob(file) {
        return new Promise((resolve, reject) => {
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
                            resolve(blob);
                        } else {
                            reject(new Error("Failed to create Blob from canvas"));
                        }
                    }, 'image/jpeg', 0.9);
                };

                img.onerror = () => {
                    reject(new Error("Error loading the uploaded image"));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error("Error reading the uploaded file"));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Processes an image and extracts invoice data.
     * @param {Blob} imageData The image data to process.
     * @returns {Promise<ScanResult>} A promise that resolves with the scan result.
     */
    static async processImage(imageData) {
        console.log("Processing image data...");
        try {
            // This is a wrapper around sendToGeminiAPI that returns the processed data
            // instead of displaying it directly
            return new Promise((resolve, reject) => {
                // Create a custom event listener to capture the processed data
                const captureProcessedData = (event) => {
                    // Remove the event listener to avoid memory leaks
                    document.removeEventListener('gemini-response-processed', captureProcessedData);
                    resolve(event.detail);
                };

                // Add event listener to capture the processed data
                document.addEventListener('gemini-response-processed', captureProcessedData, { once: true });

                // Override the processGeminiResponse method temporarily to capture the data
                const originalProcessMethod = Scan.processGeminiResponse;
                Scan.processGeminiResponse = (responseData) => {
                    try {
                        // Extract the invoice data from the response
                        const generatedContent = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
                        let invoiceData;

                        if (!generatedContent) {
                            throw new Error("No invoice details generated by the API.");
                        }

                        try {
                            const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
                            const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
                            invoiceData = JSON.parse(jsonString);
                        } catch (parseError) {
                            throw new Error("Could not understand the invoice details format.");
                        }

                        // Dispatch event with the processed data
                        document.dispatchEvent(new CustomEvent('gemini-response-processed', {
                            detail: invoiceData
                        }));

                        // Call the original method to display the results
                        originalProcessMethod.call(Scan, responseData);
                    } catch (error) {
                        // Restore the original method
                        Scan.processGeminiResponse = originalProcessMethod;
                        reject(error);
                    }
                };

                // Send the image data to the API
                Scan.sendToGeminiAPI(imageData).catch(error => {
                    // Restore the original method
                    Scan.processGeminiResponse = originalProcessMethod;
                    reject(error);
                });
            });
        } catch (error) {
            console.error("Error processing image:", error);
            throw error;
        }
    }

    /**
     * Displays the scan results in the review modal.
     * @param {ScanResult} results The scan results to display.
     */
    static displayResults(results) {
        console.log("Displaying scan results:", results);
        // Create a mock response object that matches the structure expected by processGeminiResponse
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify(results)
                    }]
                }
            }]
        };

        // Use the existing method to display the results
        Scan.processGeminiResponse(mockResponse);
    }

    /**
     * Re-scans the last captured or uploaded image.
     * This allows users to try again if the AI didn't recognize items correctly.
     */
    static rescanImage() {
        console.log("===== RESCAN INITIATED =====");

        // Use the global variable as a fallback if the class property is null
        if (!Scan.lastImageBlob && globalLastImageBlob) {
            console.log("Class lastImageBlob is null, but globalLastImageBlob is available. Using global copy.");
            Scan.lastImageBlob = globalLastImageBlob;
        }

        console.log("Re-scanning last image...", Scan.lastImageBlob ? `Image blob size: ${Scan.lastImageBlob.size} bytes, type: ${Scan.lastImageBlob.type}` : "No image blob available");

        // Debug: Check if this method is accessible
        console.log("rescanImage method called successfully");

        if (!Scan.lastImageBlob) {
            console.error("No image available for re-scanning.");
            UI.showToast("No image available for re-scanning.", "error");
            return;
        }

        // Hide the review modal
        const reviewModal = document.getElementById('scanReviewModal');
        if (reviewModal) {
            reviewModal.classList.add('hidden');
        }

        // Show the scan modal with loading overlay
        const scanModal = document.getElementById('scanModal');
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        if (scanModal) {
            scanModal.classList.remove('hidden');
        }

        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        UI.showToast("Re-scanning image...", "info");

        try {
            // Re-send the image to the Gemini API with the isRescanning flag set to true
            Scan.sendToGeminiAPI(Scan.lastImageBlob, true)
                .catch(error => {
                    console.error("Error during re-scan:", error);
                    UI.showToast(`Re-scan failed: ${error.message}`, "error");
                    // Note: The sendToGeminiAPI method will handle hiding the loading overlay and modal
                });
        } catch (error) {
            console.error("Unexpected error initiating re-scan:", error);
            UI.showToast(`Re-scan failed: ${error.message}`, "error");

            // Ensure UI is cleaned up
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }

            // Close camera stream but preserve the image blob for potential retry
            Scan.closeCameraStream(true, true); // hideModal=true, preserveImageBlob=true
        }
    }
    /**
     * Test function to verify re-scan functionality.
     * This can be called directly from the browser console: Scan.testRescan()
     */
    static testRescan() {
        console.log("===== TEST RESCAN FUNCTION CALLED =====");

        // Use the global variable as a fallback if the class property is null
        if (!Scan.lastImageBlob && globalLastImageBlob) {
            console.log("Class lastImageBlob is null, but globalLastImageBlob is available. Using global copy for test.");
            Scan.lastImageBlob = globalLastImageBlob;
        }

        if (Scan.lastImageBlob) {
            console.log(`Last image blob exists: Size: ${Scan.lastImageBlob.size} bytes, type: ${Scan.lastImageBlob.type}`);
            Scan.rescanImage();
        } else {
            console.error("No image blob available for re-scanning test");
            alert("No image blob available for re-scanning test. Please capture or upload an image first.");
        }
    }
} // ========= End of Scan Class =========

// Note: Event listener setup for the main scan button is handled in ui.js
// Add a global function for testing re-scan from the console
window.testRescan = function() {
    Scan.testRescan();
};
// The check in ui.js ensures `Scan.initiateScan()` is called correctly.