# Contact form

The portfolio contact form opens a prefilled email addressed to `tjkennethbobadilla@gmail.com` in the visitor's default email app. The visitor must send the message from that app; the website does not send or store form submissions itself.

## Password-protected CV download

The portfolio's desktop and mobile **Download CV** link opens the protected-resume modal. The modal submits the six-digit access code to the Google Apps Script Web App in `Code.gs`; the server checks the code and returns the PDF only after a successful check. The response is sent to the page through a hidden iframe, so the static portfolio does not need to expose a password or rely on cross-origin `fetch`. The standalone Apps Script password and download pages also use the portfolio's Sora and Space Mono fonts, dark/light palette, and a theme toggle.

1. Keep the CV PDF in Drive with its sharing access set to **Restricted**. Its file ID is configured in `Code.gs`; never enable “Anyone with the link” or publish a copy of the PDF with the website.
2. In the Apps Script project for the deployed Web App, replace its `Code.gs` with this repository's current `Code.gs` and save.
3. In Apps Script Project Settings, add a Script Property named `CV_DOWNLOAD_PASSWORD` and set it to your six-digit numeric access code. Do not put the code in this repository, the website HTML, or frontend environment variables.
4. In `index.html`, set the hidden `#cv-download-request` form's `action` to the Web App's `/exec` URL. If the Web App has not been configured, leave that action blank; the modal will tell visitors that resume downloads are not configured.
5. In **Deploy → Manage deployments**, edit the existing Web App deployment and select **New version** so it includes the current `Code.gs`. It must execute as you and be accessible to anyone; the server-side code check protects the private Drive file.

After deployment, test both an incorrect and the correct code from the portfolio. An incorrect code should leave the modal open and allow another attempt; an unconfigured Script Property or a service that does not respond is reported instead of displaying a false success. The legacy Apps Script password page remains available through its `/exec` URL. If the PDF was ever committed to a public repository, removing the current copy does not erase it from Git history.