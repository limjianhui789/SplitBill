// js/scan.js - Handles invoice scanning functionality

class Scan {
    static currentStream = null; // Store the current stream to close it later

    /**
     * Initiates the invoice scanning process.
     * Attempts to access the user's camera and displays it in the modal.
     */
    static async initiateScan() {
        console.log("Initiating invoice scan...");
        const scanModal = document.getElementById('scanModal');
        const videoElement = document.getElementById('cameraFeed');
        const captureBtn = document.getElementById('captureScanBtn');
        const closeBtn = document.getElementById('closeScanModalBtn');
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        if (!scanModal || !videoElement || !captureBtn || !closeBtn || !loadingOverlay) {
            console.error("Scan modal elements not found in the DOM.");
            UI.showToast("Scan interface failed to load.", "error");
            return;
        }

        // Hide loading overlay initially
        loadingOverlay.classList.add('hidden');

        // Check for mediaDevices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Browser API navigator.mediaDevices.getUserMedia not available");
            UI.showToast("Camera access is not supported by your browser.", "error");
            return;
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

            // Display the camera stream in the existing modal elements
            videoElement.srcObject = stream;
            // Ensure video plays on mobile Safari etc.
            videoElement.play().catch(error => {
                console.error("Video play failed:", error);
                UI.showToast("Could not start camera preview.", "warning");
            });

            // Assign event listeners (ensure they aren't duplicated if re-opening)
            captureBtn.onclick = () => Scan.captureImage(videoElement); // Pass only video element
            closeBtn.onclick = () => Scan.closeCameraStream(); // Close uses stored stream

            // Show the modal
            scanModal.classList.remove('hidden');

        } catch (err) {
            console.error("Error accessing camera:", err);
            Scan.currentStream = null; // Clear stream ref on error
            let message = "Could not access camera.";
            if (err.name === "NotAllowedError") {
                message = "Camera access permission was denied. Please allow access in your browser settings.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                message = "No camera found on this device.";
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                message = "Camera might be already in use by another application.";
            } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
                message = "Could not satisfy camera constraints (e.g., resolution).";
            }
            UI.showToast(message, "error");
            scanModal.classList.add('hidden'); // Ensure modal is hidden on error
        }
    }

    /**
     * Stops the camera stream tracks and hides the modal.
     */
    static closeCameraStream() {
        const scanModal = document.getElementById('scanModal');
        const videoElement = document.getElementById('cameraFeed');

        if (Scan.currentStream) {
            Scan.currentStream.getTracks().forEach(track => track.stop());
            console.log("Camera stream stopped.");
            Scan.currentStream = null; // Clear the stored stream
        }
        if (scanModal) {
            scanModal.classList.add('hidden');
        }
         if (videoElement) {
             videoElement.srcObject = null; // Release the stream reference
             // Optional: Pause video to be sure
             videoElement.pause();
         }
    }


    /**
     * Captures an image from the video stream.
     * @param {HTMLVideoElement} videoElement The video element showing the stream.
     */
    static captureImage(videoElement) {
        console.log("Capturing image...");
        const loadingOverlay = document.getElementById('scanLoadingOverlay');

        if (!videoElement.videoWidth || !videoElement.videoHeight) {
            console.error("Video dimensions are zero, cannot capture.");
            UI.showToast("Error capturing image: Video not ready.", "error");
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
                Scan.sendToGeminiAPI(blob); // Handles hiding overlay on completion/error
            } else {
                console.error("Failed to create Blob from canvas.");
                 UI.showToast("Failed to capture image.", "error");
                 if (loadingOverlay) loadingOverlay.classList.add('hidden'); // Hide loading on error
                 Scan.closeCameraStream(); // Close stream if capture fails
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
         const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
                    "response_mime_type": "application/json",
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
                  if (loadingOverlay) loadingOverlay.classList.add('hidden');
                  Scan.closeCameraStream();

                 if (!response.ok) {
                     let errorMsg = 'Unknown API error';
                     try {
                         const errorData = await response.json();
                         console.error("Gemini API Error Response:", errorData);
                         errorMsg = errorData?.error?.message || `Status ${response.status}`;
                     } catch (e) {
                         const textResponse = await response.text();
                         console.error("Could not parse API error response:", textResponse);
                         errorMsg = `Status ${response.status} - ${textResponse.substring(0, 100)}`;
                     }
                     throw new Error(`API Error: ${errorMsg}`);
                 }

                 const data = await response.json();
                 console.log("Gemini API Response:", data);

                 // Process the response and show the review modal
                 Scan.processGeminiResponse(data);

             } catch (error) {
                 console.error("Error calling Gemini API:", error);
                 UI.showToast(`Failed to process invoice: ${error.message}`, "error");
                  // Ensure loading is hidden and stream closed on error
                  if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) loadingOverlay.classList.add('hidden');
                  if (Scan.currentStream) Scan.closeCameraStream();
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
      * Processes the response from the Gemini API.
      * Extracts item data and populates the review modal.
      * @param {object} responseData The response object from the Gemini API.
      */
     static processGeminiResponse(responseData) {
         console.log("Processing Gemini response...");
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
             // Gemini response structure might vary. Now expecting JSON directly.
             const generatedContent = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
             let invoiceData;

              if (!responseData?.candidates?.[0]?.content) {
                  // Check for safety ratings or blocked responses
                 const blockReason = responseData?.promptFeedback?.blockReason;
                 if (blockReason) {
                     console.warn(`Content blocked by API: ${blockReason}`);
                     throw new Error(`Invoice processing blocked (${blockReason}).`);
                 }
                 const finishReason = responseData?.candidates?.[0]?.finishReason;
                  if (finishReason && finishReason !== "STOP") {
                     console.warn(`Generation finished unexpectedly: ${finishReason}`);
                     throw new Error(`Invoice processing incomplete (${finishReason}).`);
                  }
                 console.error("No content found in Gemini response structure:", responseData);
                 throw new Error("No content generated by the API.");
              }

             try {
                  // If response_mime_type was successful, text should be parsable JSON
                  invoiceData = JSON.parse(generatedContent);
             } catch (parseError) {
                  console.error("Failed to parse Gemini response as JSON:", parseError, "\nRaw Content:", generatedContent);
                 throw new Error("Could not understand the invoice details format.");
             }

             console.log("Parsed Invoice Data:", invoiceData);

             // --- Populate Review Modal ---
             reviewListContainer.innerHTML = ''; // Clear previous items
             let itemsAddedCount = 0;
             let runningTotal = 0;

             if (invoiceData && Array.isArray(invoiceData.lineItems) && invoiceData.lineItems.length > 0) {
                 invoiceData.lineItems.forEach((item, index) => {
                     const description = item.description || `Scanned Item ${index + 1}`;
                     const price = parseFloat(item.price);

                     if (isNaN(price)) {
                         console.warn(`Invalid price for item: ${description}`, item.price);
                         // Optionally skip item or use price 0
                         // return; // Skip item if price is invalid
                     }

                     const priceValue = !isNaN(price) ? price : 0; // Use 0 if price is invalid/missing
                     runningTotal += priceValue;
                     itemsAddedCount++;

                     // Create list item element for review
                     const li = document.createElement('div');
                     li.className = 'flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm';
                     // Store data attributes for potential later use (e.g., adding to bill)
                     li.dataset.description = description;
                     li.dataset.price = priceValue.toFixed(2);

                     li.innerHTML = `
                         <span class="text-gray-800 dark:text-gray-200">${Utils.escapeHTML(description)}</span>
                         <span class="font-semibold text-gray-900 dark:text-white">${Utils.formatCurrency(priceValue)}</span>
                     `;
                     reviewListContainer.appendChild(li);
                 });
             }

             if (itemsAddedCount === 0) {
                  reviewListContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No items found on the invoice.</p>';
             }

             // Update total amount display (use grandTotal from API if available, otherwise sum of items)
             const grandTotal = parseFloat(invoiceData.grandTotal);
             const displayTotal = !isNaN(grandTotal) ? grandTotal : runningTotal;
             scannedTotalEl.textContent = Utils.formatCurrency(displayTotal);
             // Store tax if available for later use (e.g. pre-filling tax field)
             const tax = parseFloat(invoiceData.tax);
             reviewModal.dataset.scannedTax = !isNaN(tax) ? tax.toFixed(2) : null;


             // --- Show Review Modal ---
             // Add simple close handlers for now. Proper item assignment would be more complex.
             finishReviewBtn.onclick = () => {
                  reviewModal.classList.add('hidden');
                  // TODO: Add logic here to potentially transfer reviewed items to the main bill.
                  // This requires deciding which person gets which item(s).
                  console.log("Review finished. Items need to be assigned manually or via future UI.");
                  UI.showToast("Review complete. Add items to people manually.", "info");
             };
              closeReviewBtn.onclick = () => reviewModal.classList.add('hidden');

              reviewModal.classList.remove('hidden'); // Show the review modal

              UI.showToast(`${itemsAddedCount} item(s) extracted. Please review.`, itemsAddedCount > 0 ? "success" : "warning");


         } catch (error) {
             console.error("Error processing Gemini response:", error);
             UI.showToast(`Error processing invoice data: ${error.message}`, "error");
             // Ensure review modal is hidden if processing fails
             if (reviewModal && !reviewModal.classList.contains('hidden')) {
                 reviewModal.classList.add('hidden');
             }
         }
     }

} // ========= End of Scan Class =========

// Add event listener for the main scan button (if it exists outside the class scope, e.g. in main.js)
// Example assuming a button with id="scanInvoiceBtn" triggers the process:
/*
document.addEventListener('DOMContentLoaded', () => {
    const scanInvoiceBtn = document.getElementById('scanInvoiceBtn'); // Make sure this ID exists in index.html
    if (scanInvoiceBtn) {
        scanInvoiceBtn.onclick = () => Scan.initiateScan();
    } else {
        console.warn('Scan Invoice button not found.');
    }
});
*/
// Note: Based on index.html, the scan button is likely part of the bottom nav,
// and its event listener might already be set up in ui.js or main.js.
// Ensure *that* listener calls `Scan.initiateScan()`.