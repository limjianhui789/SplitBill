# Plan: Invoice Scanning Feature for SplitBill

This document outlines the plan to add an invoice scanning feature to the SplitBill application.

## Goal

Allow users to scan an invoice using their device camera, have an AI extract line items and total, review the extracted data, and add selected items to the current bill.

## Approach

The implementation will involve modifying the UI, creating a new JavaScript module (`scan.js`) for camera and AI interaction, and integrating the results with the existing bill calculation logic.

**API Details:**

*   **Provider:** Unbound AI (via `https://api.getunbound.ai/v1/chat/completions`)
*   **Model:** `gpt-4o-mini`
*   **Authentication:** Bearer Token (API Key provided by user)
*   **Method:** Direct client-side calls from `scan.js`.
    *   **Security Note:** Embedding API keys directly in client-side code is insecure and not recommended for production environments. This plan proceeds based on user confirmation for this specific context.

**Key Identifiers:**

*   **Add Item Function:** `Calculator.addItemField()`
*   **Item Input Classes:** `item-description`, `item-quantity`, `item-price`

## Implementation Phases

### Phase 1: UI Modification & Camera Integration

1.  **Modify Bottom Navigation Button (`index.html` & `js/ui.js`):**
    *   Change the icon inside `#addButton` from `ti-plus` to `ti-scan` in `index.html`.
    *   Modify the `#addButton` event listener in `js/ui.js` (`initFancyBottomNav`) to call `Scan.initiateScan()` instead of `Person.addPersonField()`.
2.  **Create Camera Modal (`index.html` & CSS):**
    *   Add hidden modal HTML (`id="scanModal"`) containing `<video id="cameraFeed">`, `<button id="captureScanBtn">`, and a close button.
    *   Add basic CSS for the modal.
3.  **Create Scan Module (`js/scan.js` - New File):**
    *   Define a `Scan` object/class.
    *   Store API endpoint and key as constants.
    *   Implement `Scan.initiateScan()`: Show `#scanModal`, call `Scan.startCamera()`.
    *   Implement `Scan.startCamera()`: Use `getUserMedia` for rear camera, stream to `#cameraFeed`, add listener to `#captureScanBtn`, handle errors.
    *   Implement `Scan.captureImage()`: Draw video frame to canvas, get Base64 data URL, stop camera, close modal, show loading indicator, call `Scan.sendImageToAI()`.
    *   Add `<script src="js/scan.js"></script>` to `index.html`.

### Phase 2: API Interaction & Data Processing

4.  **Implement API Call (`js/scan.js`):**
    *   Implement `Scan.sendImageToAI(imageDataUrl)`:
        *   Construct AI prompt (OpenAI format) with Base64 image and instructions for JSON output (`{"items": [...], "total": ...}`).
        *   Use `fetch` POST to Unbound API with `Authorization` and `Content-Type` headers.
        *   Send model and messages payload.
        *   Handle success: Parse response JSON, parse nested JSON content, call `Scan.displayScannedItems()`.
        *   Handle failure: Show error toast, remove loading indicator.
5.  **Create Scanned Items Review UI (`index.html`, CSS, `js/scan.js`):**
    *   Add hidden modal/section HTML (`id="scanReviewModal"`).
    *   Implement `Scan.displayScannedItems(data)`:
        *   Clear previous review content.
        *   Loop through `data.items`, create list items with description, quantity, price, and an "Add Item" button (storing item data via data attributes).
        *   Optionally display `data.total`.
        *   Add event listeners to "Add Item" buttons calling `Scan.addItemToBill()`.
        *   Show `#scanReviewModal`, remove loading indicator.

### Phase 3: Integration with Bill

6.  **Integrate Scanned Items (`js/scan.js` & `js/calculator.js`):**
    *   Implement `Scan.addItemToBill(event)`:
        *   Get item data from the clicked button.
        *   Call `Calculator.addItemField()` with the description, quantity, and price. (Note: `Calculator.addItemField` might need adjustments if it doesn't directly accept these parameters).
        *   Visually update the added item's button in the review modal.
    *   Ensure `Calculator.calculate()` is triggered appropriately after adding items.

## Workflow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI (index.html, ui.js)
    participant Scan (scan.js)
    participant Camera API
    participant Unbound AI API
    participant Bill Logic (calculator.js)

    User->>+UI: Clicks Scan Button (#addButton)
    UI->>+Scan: Calls Scan.initiateScan()
    Scan->>Scan: Shows Scan Modal
    Scan->>+Camera API: Requests Camera Access (getUserMedia)
    Camera API-->>-Scan: Returns Camera Stream
    Scan->>Scan: Displays Stream in Modal
    User->>+Scan: Clicks Capture Button
    Scan->>Scan: Captures Image (Canvas -> DataURL)
    Scan->>-Camera API: Stops Camera Stream
    Scan->>Scan: Closes Scan Modal, Shows Loading
    Scan->>+Unbound AI API: Sends Image Data + Prompt (fetch POST)
    Unbound AI API-->>-Scan: Returns JSON Response (Items, Total)
    Scan->>Scan: Parses AI Response
    Scan->>Scan: Hides Loading
    Scan->>Scan: Shows Review Modal with Extracted Items + "Add" Buttons
    User->>+Scan: Clicks "Add Item" Button for an item
    Scan->>+Bill Logic: Calls Calculator.addItemField(desc, qty, price) function
    Bill Logic->>UI: Adds new item row to index.html form
    Bill Logic->>Bill Logic: Recalculates totals
    Scan->>Scan: Updates UI of added item in Review Modal
    User->>Scan: Closes Review Modal (optional)