var CLIENT_ID = '859935142425-ggbvpv3390svn98etcgs7086np5706t7.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAp4iuya8UGmMlgtJKz000ZA5wjw8R6kyI';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file";
let MASTER_SHEET = "1NwrKVlMeWSyOHZmWzzYpMjNjv-GiMsbaE-lcat0g-FM";
let MEETING_RECORDS_DIR = "1nAp4NXkFjUiIZOaRLzAZq38dyli3RBa1";
let MIME_SHEET = "application/vnd.google-apps.spreadsheet";
let SHEETS, DRIVE, NETID, DAY_SHEET, authorizeButton, netIdField, nameField;
let DATE = new Date();
let DATE_STRING = DATE.getMonth() + 1 + "/" +
                  DATE.getDate() + "/" + DATE.getFullYear();

function handleClientLoad() {
  authorizeButton = document.getElementById('authorize-button');
  netIdField = document.getElementById('net-id');
  nameField = document.getElementById('name-field');
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    gapi.client.load('sheets', 'v4', function(){
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
    authorizeButton.onclick = handleAuthClick;
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    SHEETS = gapi.client.sheets.spreadsheets.values;
    DRIVE = gapi.client.drive.files;
    getMeetingSheetId(conductAttendance);
  } else {
    authorizeButton.style.display = 'block';
  }
}

function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function getMeetingSheetId(callback){
  DRIVE.list({
    q: "name = '" + DATE_STRING + "' and '" + MEETING_RECORDS_DIR + "' in parents"
  }).then(function(response){
    if(response.result.files.length == 0){
      console.log('New sheet being created...')
      createSheetForDay(callback);
    }
    else {
      console.log('Sheet for ' + DATE_STRING + ' with ID ' + response.result.files[0].id + ' found');
      DAY_SHEET = response.result.files[0].id;
      callback();
    }
  });
}

function createSheetForDay(callback){
  DRIVE.create({
    resource: {
      name: DATE_STRING,
      mimeType: MIME_SHEET,
      parents: [ MEETING_RECORDS_DIR ]
    }
  }).then(function(response){
    console.log('Created new sheet with ID ' + response.result.files[0].id);
    callback(file.id);
  });
}

function conductAttendance(){
  id_input.value = "";
  netIdField.style.display = 'block';
  first_input.value = "";
  last_input.value = "";
  nameField.style.display = 'none';
  document.body.addEventListener('keyup', handleNETIDEnter);
}

function handleNETIDEnter(e){
  if ( e.keyCode == 13 ) {
    user_update.innerHTML = "";
    document.body.removeEventListener('keyup', handleNETIDEnter);
    netIdField.style.display = 'none';
    NETID = id_input.value;
    searchForUserInMasterAndAdd();
  }
}

function searchForUserInMasterAndAdd(){
  console.log("Searching for " + NETID);
  SHEETS.append({
    spreadsheetId: MASTER_SHEET,
    range: 'Sheet1!F1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',
    resource: {
      values: [ [ "=query(A:B, \"select A where B = '" + NETID + "'\")" ] ]
    }
  }).then(function(response){
    SHEETS.get({
      spreadsheetId: MASTER_SHEET,
      range: "Sheet1!F1"
    }).then(function(response){
      let userId = '#N/A'
      if(typeof response.result.values != 'undefined') userId = response.result.values[0][0];

      if(userId == '#N/A'){
        console.log('User not found, adding first time user');
        clearQueries();
        addFirstTimeUser(NETID);
      }
      else{
        console.log('User found, updating attendance information');
        updateMasterSheetAttendance(userId);
        addExistingToDaySheet(userId);
      }
    });
  });
}

function addExistingToDaySheet(rowNumToRead){
  SHEETS.get({
    spreadsheetId: MASTER_SHEET,
    range: "Sheet1!B" + rowNumToRead + ":D" + rowNumToRead
  }).then(function(response){
    let values = response.result.values[0];
    appendInfoToSheet(DAY_SHEET, values);
    console.log("Existing user added to day sheet");
    clearQueries();
    user_update.innerHTML = values[1] + " " + values[2] + "'s attendance record has been updated";
    conductAttendance();
  });
}

function addFirstTimeUser(){
  nameField.style.display = 'flex';
  document.body.addEventListener( 'keyup', handleNameEnter);
}

function handleNameEnter(e){
  if ( e.keyCode == 13 ) {
    document.body.removeEventListener('keyup', handleNameEnter);
    nameField.style.display = 'none';
    findNextIdAndAppendToSheets(first_input.value, last_input.value);
  }
}

function findNextIdAndAppendToSheets(firstName, lastName){
  SHEETS.append({
    spreadsheetId: MASTER_SHEET,
    range: 'Sheet1!F1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',
    resource: { values: [ [ "=max(A:A)" ] ] }
  }).then(function(response){
    findNextId([ NETID, firstName, lastName ]);
  });
}

function findNextId(values){
  SHEETS.get({
    spreadsheetId: MASTER_SHEET,
    range: "Sheet1!F1"
  }).then(function(response){
    appendInfoToSheet(DAY_SHEET, values);
    if(response.result.values == 'undefined'
       || isNaN(parseInt(response.result.values[0]))){
       values.unshift( 1 );
     }
    else {
      values.unshift(parseInt(response.result.values[0]) + 1);
      console.log("New user given ID of " + parseInt(response.result.values[0]));
    }
    values.push('1');
    appendInfoToSheet(MASTER_SHEET, values);
    clearQueries();
    user_update.innerHTML = values[2] + " " + values[3] + "'s attendance record has been updated";
    conductAttendance();
  });
}

function appendInfoToSheet(sheetId, values){
  SHEETS.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:A',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [ values ] }
  }).then(function(response){
    if(sheetId == MASTER_SHEET)
      console.log("New values entered to master sheet");
    else
      console.log("New values entered to day's sheet");
  });
}

function updateMasterSheetAttendance(rowNumToUpdate){
  SHEETS.get({
    spreadsheetId: MASTER_SHEET,
    range: "Sheet1!E" + rowNumToUpdate
  }).then(function(response){
    let values = [ parseInt(response.result.values[0]) + 1 ];
    SHEETS.update({
      spreadsheetId: MASTER_SHEET,
      range: "Sheet1!E" + rowNumToUpdate,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [ values ] }
    }).then(function(response){
      console.log("Master sheet attendance updated");
    });
  });
}

function clearQueries(){
  SHEETS.clear({
    spreadsheetId: MASTER_SHEET,
    range: 'Sheet1!F:F'
  }).then(function(response){
    console.log("Query column cleared");
  });
}
