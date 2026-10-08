# Google contact form setup

1. Open [script.google.com](https://script.google.com/) and create a new project.
2. Replace the starter code with the contents of `Code.gs`, then save.
3. Select **Deploy > New deployment**, choose **Web app**, set **Execute as** to **Me**, and set access to **Anyone**. Deploy and authorize Gmail access for your Google account.
4. Copy the web app URL ending in `/exec`. In `index.html`, replace `REPLACE_WITH_YOUR_DEPLOYMENT_ID` in the form's `action` URL with the deployment ID from that URL.
5. Submit a test message from the portfolio. The message will be sent to `tjkennethbobadilla@gmail.com` through the Google account that deployed the script. Replies go to the sender's email address.

The web app URL is public so the portfolio can submit without visitors signing in. The script validates the submitted fields and includes a hidden honeypot field, but a public form can still receive spam.