const RECIPIENT_EMAIL = "tjkennethbobadilla@gmail.com";

function doPost(e) {
    const fields = e && e.parameter ? e.parameter : {};

    if (fields._honey) {
        return responsePage("Thanks for reaching out.");
    }

    const name = String(fields.name || "").trim();
    const senderEmail = String(fields.email || "").trim();
    const message = String(fields.message || "").trim();

    if (
        !name || name.length > 120 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) || senderEmail.length > 254 ||
        !message || message.length > 5000
    ) {
        return responsePage("Please check the form details and try again.");
    }

    const body = `Name: ${name}\nEmail: ${senderEmail}\n\n${message}`;

    try {
        GmailApp.sendEmail(RECIPIENT_EMAIL, "New portfolio contact message", body, {
            replyTo: senderEmail,
            name: name
        });
        return responsePage("Thanks for reaching out. Your message has been sent.");
    } catch (error) {
        return responsePage("The message could not be sent. Please email " + RECIPIENT_EMAIL + " directly.");
    }
}

function responsePage(message) {
    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Contact</title><body style=\"margin:0;padding:3rem 1.5rem;background:#f5f5f2;color:#0d0d0d;font:16px Arial,sans-serif\"><main style=\"max-width:36rem;margin:10vh auto;line-height:1.6\"><h1>Portfolio contact</h1><p>" +
        message +
        "</p></main></body></html>"
    ).setTitle("Portfolio contact");
}