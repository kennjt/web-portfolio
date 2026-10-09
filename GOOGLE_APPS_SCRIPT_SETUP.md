# Contact form

The portfolio contact form opens a prefilled email addressed to `tjkennethbobadilla@gmail.com` in the visitor's default email app. The visitor must send the message from that app; the website does not send or store form submissions itself.

## Password-protected CV download

`Code.gs` can serve the CV through a Google Apps Script Web App. The PDF must be stored in Google Drive with restricted access; do not enable “Anyone with the link” on the file.

1. Keep the CV PDF in Drive with its sharing access set to **Restricted**. Its file ID is configured in `Code.gs`.
2. In the Apps Script project for the deployed Web App, replace its `Code.gs` with this repository's current `Code.gs` and save.
3. In Apps Script Project Settings, add a Script Property named `CV_DOWNLOAD_PASSWORD` and set its value to your chosen password. Do not put the password in this repository or in the website HTML.
4. In **Deploy → Manage deployments**, edit the existing Web App deployment and select **New version**. It must execute as you and be accessible to anyone; the password check protects the download while the Drive file remains private.

The desktop navbar and mobile menu already link to the deployed Web App. Visitors enter the password there and can download the PDF only after it is accepted. Keep the PDF out of the published website directory; a public copy there would bypass the password gate. If the PDF was ever committed to a public repository, removing the current copy does not erase it from Git history.