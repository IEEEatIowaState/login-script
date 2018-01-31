## IEEE Login Script

This script is used for keeping attendance at ISU chapter IEEE meetings. 
It was written using NodeJS and uses [Google Sheets API V4](https://developers.google.com/sheets/api/reference/rest/) and [Google Drive API V3](https://developers.google.com/drive/v3/reference/). 

In order to run this you will need access to a Google account which has permission to edit 
[the attendance files](https://drive.google.com/drive/u/1/folders/0B2RZchU2dvreZXd0SkpOOC16Slk) and will need to copy the OAuth2.0 Client ID JSON file to the directory from [here](https://console.developers.google.com/apis/credentials?project=silken-apex-192523).

Additionally, you will need to run these two commands to install the required Node packages (Also node is required,install [here]()https://www.npmjs.com/get-npm):
```npm install googleapis --save

npm install google-auth-library@0.* --save```

To run this script navigate in a terminal to the directory where ```login.js``` exists and type ```node login.js```.
