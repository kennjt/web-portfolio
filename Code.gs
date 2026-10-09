const RECIPIENT_EMAIL = "tjkennethbobadilla@gmail.com";
const CV_FILE_ID = "1u8NXNvjnlzCwDbqMfdDnJ5y4ycqSEZCo";
const CV_PORTFOLIO_ORIGIN = "https://kennjt.github.io";

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
    const requestId = String(fields.requestId || "");
    const isModalRequest = /^[A-Za-z0-9-]{1,80}$/.test(requestId);
    const responseOrigin = String(fields.responseOrigin || "");
    const respondWithError = (message) => isModalRequest
        ? cvDownloadResultPage(requestId, { ok: false, message: message }, responseOrigin)
        : cvPasswordPage(message);

    if (!expectedPassword || !/^\d{6}$/.test(expectedPassword)) {
        return respondWithError("CV access is not configured with a 6-digit code. Please contact the portfolio owner.");
    }

    const candidate = String(fields.cvPassword || "");
    if (!/^\d{6}$/.test(candidate) || !constantTimeEquals(candidate, expectedPassword)) {
        return respondWithError("Incorrect access code. Please try again.");
    }

    try {
        const file = DriveApp.getFileById(CV_FILE_ID);
        const blob = file.getBlob();
        if (blob.getContentType() !== "application/pdf") {
            return respondWithError("The CV file is not a PDF. Please contact the portfolio owner.");
        }

        const base64 = Utilities.base64Encode(blob.getBytes());
        const fileName = file.getName().replace(/[^\w .()-]/g, "_");
        return isModalRequest
            ? cvDownloadResultPage(requestId, {
                ok: true,
                base64: base64,
                fileName: fileName
            }, responseOrigin)
            : cvReadyPage(base64, fileName);
    } catch (error) {
        console.error("CV download failed: " + error);
        return respondWithError("The CV could not be retrieved. Please contact the portfolio owner.");
    }
}

function cvDownloadResultPage(requestId, result, responseOrigin) {
    const targetOrigin = responseOrigin === CV_PORTFOLIO_ORIGIN
        ? CV_PORTFOLIO_ORIGIN
        : responseOrigin === "null"
            ? "*"
            : CV_PORTFOLIO_ORIGIN;
    const payload = JSON.stringify({
        type: "cv-download-result",
        requestId: requestId,
        ok: result.ok,
        message: result.message || "",
        base64: result.base64 || "",
        fileName: result.fileName || ""
    }).replace(/[<\u2028\u2029]/g, (character) => ({
        "<": "\\u003c",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
    })[character]);

    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Resume download</title>" +
        "<body><script>window.top.postMessage(" + payload + ", " + JSON.stringify(targetOrigin) + ");</script></body></html>"
    )
        .setTitle("Resume download")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
        ? "<p class=\"cv-error\" role=\"alert\">" + escapeHtml(message) + "</p>"
        : "";

    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\" data-theme=\"dark\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
        cvPageHead("Protected Resume") +
        "<body>" + cvThemeButton() +
        "<main class=\"page-shell\"><section class=\"resume-card\" aria-labelledby=\"resume-title\">" +
        "<div class=\"lock-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\"><rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M8 10V7a4 4 0 1 1 8 0v3\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><circle cx=\"12\" cy=\"15\" r=\"1.2\" fill=\"currentColor\"/><path d=\"M12 16v2\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/></svg></div>" +
        "<h1 id=\"resume-title\">Protected Resume</h1><p class=\"card-description\">Please enter the 6-digit access code to download resume.</p>" + safeMessage +
        "<form method=\"post\" action=\"" + escapeHtml(actionUrl) + "\">" +
        "<input type=\"hidden\" name=\"action\" value=\"download-cv\">" +
        "<label for=\"cv-password\">Access code</label><input class=\"password-field\" id=\"cv-password\" name=\"cvPassword\" type=\"password\" inputmode=\"numeric\" pattern=\"[0-9]{6}\" maxlength=\"6\" autocomplete=\"one-time-code\" placeholder=\"Enter 6-digit code\" required>" +
        "<button class=\"primary-button\" type=\"submit\">DOWNLOAD</button></form></section></main>" +
        cvThemeScript() +
        "</body></html>"
    ).setTitle("Download CV");
}

function cvReadyPage(base64, fileName) {
    const safeBase64 = JSON.stringify(base64);
    const safeFileName = JSON.stringify(fileName.replace(/[^\w .()-]/g, "_"));

    return HtmlService.createHtmlOutput(
        "<!doctype html><html lang=\"en\" data-theme=\"dark\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
        cvPageHead("Resume Ready") +
        "<body>" + cvThemeButton() +
        "<main class=\"page-shell\"><section class=\"resume-card\" aria-labelledby=\"resume-title\">" +
        "<div class=\"lock-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\"><rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M8 10V7a4 4 0 1 1 8 0v3\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><circle cx=\"12\" cy=\"15\" r=\"1.2\" fill=\"currentColor\"/><path d=\"M12 16v2\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/></svg></div>" +
        "<h1 id=\"resume-title\">Access Granted</h1><p class=\"card-description\">Your resume is ready to download.</p>" +
        "<button id=\"download-cv\" class=\"primary-button\" type=\"button\">DOWNLOAD RESUME</button></section></main>" +
        "<script>const encoded=" + safeBase64 + ";const fileName=" + safeFileName + ";" +
        "document.querySelector('#download-cv').addEventListener('click',()=>{const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000)});</script>" +
        cvThemeScript() +
        "</body></html>"
    ).setTitle("Download CV");
}

function cvPageHead(title) {
    return "<title>" + escapeHtml(title) + "</title>" +
        "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">" +
        "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>" +
        "<link href=\"https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap\" rel=\"stylesheet\">" +
        "<style>" +
        ":root{color-scheme:dark;--page:#0D0D0D;--card:#1B1B1B;--text:#F5F5F2;--muted:#A9A9A9;--border:rgba(255,255,255,.13);--field:#111111;--field-border:rgba(255,255,255,.2);--backdrop:rgba(0,0,0,.35);--accent:#FFFFFF;--accent-rgb:255,255,255;--accent-strong:#FFFFFF}" +
        "html[data-theme=light]{color-scheme:light;--page:#F5F5F2;--card:#F5F5F2;--text:#0D0D0D;--muted:#5B5B58;--border:rgba(13,13,13,.16);--field:#FFFFFF;--field-border:rgba(13,13,13,.25);--backdrop:rgba(13,13,13,.035);--accent:#0D0D0D;--accent-rgb:13,13,13;--accent-strong:#0D0D0D}" +
        "*{box-sizing:border-box}body{min-height:100vh;margin:0;padding:2rem 1rem;display:grid;place-items:center;background-color:var(--page);background-image:linear-gradient(var(--backdrop) 1px,transparent 1px),linear-gradient(90deg,var(--backdrop) 1px,transparent 1px);background-size:43px 43px;color:var(--text);font:400 16px/1.6 Sora,sans-serif;transition:background-color 220ms ease,color 220ms ease}" +
        ".page-shell{width:min(27rem,100%)}.resume-card{position:relative;padding:2.5rem 2.25rem 2rem;border:1px solid var(--border);border-radius:1.125rem;background:var(--card);box-shadow:0 24px 80px rgba(0,0,0,.25);text-align:center}" +
        ".lock-icon{width:3.25rem;height:3.25rem;margin:0 auto 1.1rem;display:grid;place-items:center;border:1px solid rgba(var(--accent-rgb),.42);border-radius:50%;background:rgba(var(--accent-rgb),.12);color:var(--accent)}.lock-icon svg{width:1.75rem;height:1.75rem}" +
        "h1{margin:0;color:var(--text);font:700 1.35rem/1.4 'Space Mono',monospace;letter-spacing:-.035em}.card-description{margin:.7rem 0 1.8rem;color:var(--muted);font-size:.82rem;line-height:1.65}" +
        "form{text-align:left}label{display:block;margin-bottom:.45rem;color:var(--muted);font-size:.75rem;font-weight:600}.password-field{display:block;width:100%;min-height:3.25rem;margin:0 0 1rem;padding:.8rem 1rem;border:1px solid var(--field-border);border-radius:4px;background:var(--field);color:var(--text);font:500 .95rem Sora,sans-serif;letter-spacing:.08em}.password-field::placeholder{color:var(--muted);letter-spacing:normal}.password-field:focus{border-color:var(--accent);outline:2px solid rgba(var(--accent-rgb),.22);outline-offset:2px}" +
        ".primary-button{width:100%;min-height:3.1rem;padding:.8rem 1.25rem;border:1px solid var(--accent-strong);border-radius:4px;background:var(--accent-strong);color:#0D0D0D;box-shadow:0 3px 0 rgba(0,0,0,.22);cursor:pointer;font:700 .76rem 'Space Mono',monospace;letter-spacing:.07em;transition:transform 160ms ease,background-color 160ms ease,color 160ms ease}.primary-button:hover{transform:translateY(-1px);background:transparent;color:var(--text)}html[data-theme=light] .primary-button{color:#FFFFFF}.primary-button:focus-visible,.theme-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:3px}" +
        ".cv-error{margin:0 0 1rem;color:#F08D84;font-size:.78rem;line-height:1.5}.theme-toggle{position:fixed;top:1rem;right:1rem;display:grid;width:2.75rem;height:2.75rem;place-items:center;padding:0;border:1px solid var(--border);border-radius:50%;background:var(--card);color:var(--accent);box-shadow:0 4px 16px rgba(0,0,0,.18);cursor:pointer}.theme-toggle:hover{transform:scale(1.05)}.theme-icon{width:1.3rem;height:1.3rem;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.theme-icon-moon,html[data-theme=light] .theme-icon-sun{display:none}html[data-theme=light] .theme-icon-moon{display:block}" +
        "@media(max-width:420px){body{padding:1rem}.resume-card{padding:2.4rem 1.25rem 1.5rem;border-radius:1rem}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}" +
        "</style>";
}

function cvThemeScript() {
    return "<script>(()=>{const root=document.documentElement;const button=document.querySelector('.theme-toggle');let saved;try{saved=localStorage.getItem('portfolio-theme')}catch(error){console.warn('Could not read the saved theme preference.',error)}const initial=['dark','light'].includes(saved)?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');function apply(theme){root.dataset.theme=theme;const next=theme==='dark'?'light':'dark';button.setAttribute('aria-label','Switch to '+next+' theme');button.title='Switch to '+next+' theme'}apply(initial);button.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';apply(next);try{localStorage.setItem('portfolio-theme',next)}catch(error){console.warn('Could not save the theme preference.',error)}})})()</script>";
}

function cvThemeButton() {
    return "<button class=\"theme-toggle\" type=\"button\" aria-label=\"Switch to light theme\" title=\"Switch theme\">" +
        "<svg class=\"theme-icon theme-icon-sun\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42\"/></svg>" +
        "<svg class=\"theme-icon theme-icon-moon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z\"/></svg></button>";
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