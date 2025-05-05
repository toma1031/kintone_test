# Kintone Inventory Update App

## Overview

This Kintone app helps manage inventory by automatically updating stock levels when new orders are placed. It consists of two main parts:

1.  **Inventory Check on Order Creation:** Before an order is saved, the app checks if there is sufficient stock available. If not, it prevents the order from being placed and displays an error message.
2.  **Stock Update After Order Creation:** After a new order is successfully created, the app automatically updates the stock level in the Item Master app.

## Files

*   **inventory-update.js:** Contains the main logic for the Kintone app, including:
    *   Fetching item stock information from the Item Master app.
    *   Checking stock levels before order creation.
    *   Updating stock levels after successful order creation.

## Setup

1.  **Kintone App IDs:**
    *   `ITEM_APP_ID`:  This constant in [inventory-update.js](inventory-update.js) refers to the Item Master app ID.  You need to replace `7` with the actual app ID of your Item Master app. The app ID is the number at the end of the app's URL (e.g., `https://yourdomain.kintone.com/k/**7**/`).
2.  **Field Codes:**
    *   The code uses specific field codes (e.g., `item_code`, `qty`, `stock`) to access data in the Kintone records.  Make sure these field codes match the actual field codes in your Order Tracking and Item Master apps.  You can check the field codes in the Kintone app settings (Settings -> Forms).
3.  **JavaScript Customization:**
    *   Upload the [inventory-update.js](inventory-update.js) file to your Order Tracking app in Kintone.  You can add this code in the JSEdit for kintone settings.

## Functionality

### Inventory Check (app.record.create.submit)

*   This event handler runs when a user submits a new order.
*   It retrieves the item code and quantity from the order record.
*   It calls the [`getItemStock`](inventory-update.js) function to get the current stock level from the Item Master app.
*   If the item is not found or the stock level is insufficient, it displays an error message and prevents the order from being saved.

### Stock Update (app.record.create.submit.success)

*   This event handler runs after an order is successfully created.
*   It retrieves the item code and quantity from the order record.
*   It calls the [`getItemStock`](inventory-update.js) function again to get the most up-to-date stock level.
*   It calculates the new stock level and updates the Item Master record using the Kintone API.
*   It displays a success message to the user.

## getItemStock Function

```javascript
const getItemStock = async (itemCode) => {
  const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
    app: ITEM_APP_ID,
    query: `item_code = "${itemCode}"`
  });
  return res.records.length > 0 ? res.records[0] : null;
};