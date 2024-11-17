function writeToGoogleSheets() {
  // Firebase Realtime Database REST API URL
  var apiUrl = firebaseToGoogleSheet_url; // Add your database path here

  // Fetch data using an HTTP request
  var response = UrlFetchApp.fetch(apiUrl);
  var data = JSON.parse(response.getContentText());

  // Get IST date and time
  var now = new Date();

  // Convert to IST using the 'Asia/Kolkata' timezone
  var options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  var istDateTimeStr = now.toLocaleString('en-GB', options);

  // Extract date and time
  var [dateStr, timeStr] = istDateTimeStr.split(', '); // Separate date and time


  // Get reference to Google Sheets
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Append data to the sheet (with separate date and time fields)
  if (data.Temperature !== undefined) {
    sheet.appendRow([dateStr, timeStr, data.Temperature, data.Humidity, data.Moisture, data.Rain]);

    // Log success
    Logger.log('Data successfully added to Google Sheets');
  } else {
    Logger.log('No new data available.');
  }
}
