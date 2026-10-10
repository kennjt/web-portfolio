# Contact form

The portfolio contact form opens a prefilled email addressed to `tjkennethbobadilla@gmail.com` in the visitor's default email app. The visitor must send the message from that app; the website does not send or store form submissions itself.

## Resume password prompt

The portfolio's **Download CV** button asks for a password on the page and then opens the resume in a new Google Drive tab. This check runs entirely in the visitor's browser and does not use Google Apps Script. Pop-ups must be allowed for the portfolio site.

This is only a casual-use gate, not access control: the password is included in public client-side code and can be read or bypassed. Anyone who obtains the Drive URL can also open it directly if Drive sharing allows it. For real confidentiality, keep the Drive file restricted and use a server-side password check.