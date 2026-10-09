const RECIPIENT_EMAIL = "tjkennethbobadilla@gmail.com";
const CV_FILE_ID = "1u8NXNvjnlzCwDbqMfdDnJ5y4ycqSEZCo";

function doGet() {
    return cvPasswordPage("");
}

function doPost(e) {
    const fields = e && e.parameter ? e.parameter : {};

    if (fields.action === "download-cv") {
        return handleCvDownload(fields);
    }

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

function handleCvDownload(fields) {
    const properties = PropertiesService.getScriptProperties();
    const expectedPassword = properties.getProperty("CV_DOWNLOAD_PASSWORD");

    if (!expectedPassword) {
        return cvPasswordPage("CV access is not configured. Please contact the portfolio owner.");
    }

    if (!constantTimeEquals(String(fields.cvPassword || ""), expectedPassword)) {
        return cvPasswordPage("Incorrect password. Please try again.");
    }

    const file = DriveApp.getFileById(CV_FILE_ID);
    const blob = file.getBlob();
    if (blob.getContentType() !== "application/pdf") {
        return cvPasswordPage("The CV file is not a PDF. Please contact the portfolio owner.");
    }

    const base64 = Utilities.base64Encode(blob.getBytes());
    return cvReadyPage(base64, file.getName());
}

function constantTimeEquals(candidate, expected) {
    let difference = candidate.length ^ expected.length;
    const length = Math.max(candidate.length, expected.length);

    for (let index = 0; index < length; index += 1) {
        difference |= (candidate.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
    }

    return difference === 0;
}

function cvPasswordPage(message) {
    const actionUrl = ScriptApp.getService().getUrl();
    const safeMessage = message
        ? "<p role=\"alert\">" + escapeHtml(message) + "</p>"
        : "";

    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Download CV</title>" +
        "<body style=\"margin:0;padding:2rem 1rem;background:#0d0d0d;color:#f5f5f2;font:16px Arial,sans-serif\"><main style=\"max-width:26rem;margin:10vh auto;line-height:1.6\">" +
        "<h1>Download CV</h1><p>Enter the password to access the CV PDF.</p>" + safeMessage +
        "<form method=\"post\" action=\"" + escapeHtml(actionUrl) + "\">" +
        "<input type=\"hidden\" name=\"action\" value=\"download-cv\">" +
        "<label for=\"cv-password\">Password</label><input id=\"cv-password\" name=\"cvPassword\" type=\"password\" autocomplete=\"current-password\" required style=\"box-sizing:border-box;display:block;width:100%;margin:.5rem 0 1rem;padding:.8rem\">" +
        "<button type=\"submit\" style=\"padding:.8rem 1rem;cursor:pointer\">Continue</button></form></main></body></html>"
    ).setTitle("Download CV");
}

function cvReadyPage(base64, fileName) {
    const safeBase64 = JSON.stringify(base64);
    const safeFileName = JSON.stringify(fileName.replace(/[^\w .()-]/g, "_"));

    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Download CV</title>" +
        "<body style=\"margin:0;padding:2rem 1rem;background:#0d0d0d;color:#f5f5f2;font:16px Arial,sans-serif\"><main style=\"max-width:26rem;margin:10vh auto;line-height:1.6\">" +
        "<h1>Password accepted</h1><p>Your CV is ready to download.</p><button id=\"download-cv\" type=\"button\" style=\"padding:.8rem 1rem;cursor:pointer\">Download CV PDF</button></main>" +
        "<script>const encoded=" + safeBase64 + ";const fileName=" + safeFileName + ";" +
        "document.querySelector('#download-cv').addEventListener('click',()=>{const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});</script>" +
        "</body></html>"
    ).setTitle("Download CV");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);
}

function responsePage(message) {
    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Contact</title><body style=\"margin:0;padding:3rem 1.5rem;background:#f5f5f2;color:#0d0d0d;font:16px Arial,sans-serif\"><main style=\"max-width:36rem;margin:10vh auto;line-height:1.6\"><h1>Portfolio contact</h1><p>" +
        message +
        "</p></main></body></html>"
    ).setTitle("Portfolio contact");
}