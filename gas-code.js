/**
 * Paste this code into a Google Apps Script project.
 * 1. Go to script.google.com
 * 2. New Project
 * 3. Paste this code into Code.gs
 * 4. Deploy > New Deployment > Select type: Web App
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Copy the Web App URL and paste it into the PWA settings.
 */

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const imageBase64 = data.image;
        const apiKey = data.key;
        const promptText = data.prompt;
        const mimeType = data.mimeType || "image/jpeg";

        if (!imageBase64 || !apiKey) {
            return createJSONOutput({ error: "Missing image or API key" });
        }

        // Call Gemini API
        const geminiResponse = callGemini(apiKey, imageBase64, mimeType, promptText);

        // Process response to create URL params
        // Assuming the prompt asks to "Extract text", we'll use the result as the query.
        const extractedText = geminiResponse.candidates[0].content.parts[0].text;

        // Create the Google Search URL
        // The user asked for "custom url params". Let's just put the text in 'q'.
        const encodedQuery = encodeURIComponent(extractedText.trim());
        const redirectUrl = `https://www.google.com/search?q=${encodedQuery}`;

        return createJSONOutput({
            success: true,
            text: extractedText,
            redirectUrl: redirectUrl
        });

    } catch (error) {
        return createJSONOutput({ error: error.toString() });
    }
}

function callGemini(apiKey, imageBase64, mimeType, prompt) {
    // Updated to use gemini-flash-latest as requested
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: imageBase64
                        }
                    }
                ]
            }
        ]
    };

    const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.error) {
        throw new Error("Gemini API Error: " + json.error.message);
    }

    return json;
}

function createJSONOutput(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// Handle OPTIONS request for CORS (Preflight)
function doOptions(e) {
    var headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
