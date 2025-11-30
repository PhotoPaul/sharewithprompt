import { get, del } from './idb-keyval.js';

// DOM Elements
const settingsSection = document.getElementById('settings-section');
const processingSection = document.getElementById('processing-section');
const settingsForm = document.getElementById('settings-form');
const apiKeyInput = document.getElementById('apiKey');
const gasUrlInput = document.getElementById('gasUrl');
const customPromptInput = document.getElementById('customPrompt');
const saveStatus = document.getElementById('save-status');
const statusText = document.getElementById('status-text');
const errorLog = document.getElementById('error-log');
const cancelBtn = document.getElementById('cancel-btn');

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { type: 'module' })
        .then(() => console.log('SW Registered'))
        .catch(err => console.error('SW Registration Failed', err));
}

// Load Settings
function loadSettings() {
    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
    gasUrlInput.value = localStorage.getItem('gas_url') || '';
    customPromptInput.value = localStorage.getItem('custom_prompt') || 'Extract text from this image';
}

// Save Settings
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
    localStorage.setItem('gas_url', gasUrlInput.value.trim());
    localStorage.setItem('custom_prompt', customPromptInput.value.trim());

    saveStatus.classList.remove('hidden');
    setTimeout(() => saveStatus.classList.add('hidden'), 3000);
});

// Convert Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove "data:image/xxx;base64," prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Handle Shared Image
async function handleShare() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('share')) return;

    // Switch UI to processing mode
    settingsSection.classList.add('hidden');
    processingSection.classList.remove('hidden');

    try {
        const imageBlob = await get('shared-image');
        if (!imageBlob) {
            throw new Error('No shared image found in storage.');
        }

        statusText.textContent = 'Image found. Preparing to send...';

        const apiKey = localStorage.getItem('gemini_api_key');
        const gasUrl = localStorage.getItem('gas_url');
        const prompt = localStorage.getItem('custom_prompt') || 'Extract text from this image';

        if (!apiKey || !gasUrl) {
            throw new Error('Missing API Key or GAS URL. Please configure settings first.');
        }

        const base64Image = await blobToBase64(imageBlob);

        statusText.textContent = 'Analyzing with Gemini...';

        // Send to GAS
        const response = await fetch(gasUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for GAS Web App calls from browser
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
                key: apiKey,
                prompt: prompt,
                mimeType: imageBlob.type
            })
        });

        // NOTE: 'no-cors' mode means we get an opaque response. We can't read the text directly.
        // However, the user requirement is: "it will open a website... on the Android's browser with some custom url params".
        // 
        // PROBLEM: We cannot read the response from GAS in 'no-cors' mode to get the URL params.
        // SOLUTION: We must use a CORS-enabled request. GAS Web Apps *do* support CORS if we return ContentService.createTextOutput().
        // So I will remove 'no-cors' and ensure the GAS script handles CORS correctly.

        // Let's retry with standard CORS
        const corsResponse = await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify({
                image: base64Image,
                key: apiKey,
                prompt: prompt,
                mimeType: imageBlob.type
            })
        });

        if (!corsResponse.ok) {
            throw new Error(`Server error: ${corsResponse.status}`);
        }

        const result = await corsResponse.json();

        if (result.error) {
            throw new Error(result.error);
        }

        statusText.textContent = 'Success! Redirecting...';

        // Clean up
        await del('shared-image');

        // Redirect
        // Assuming result.url contains the full Google URL or params
        // The prompt says: "open a website... with some custom url params that will be received"
        // Let's assume the GAS returns the query string or full URL.
        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            throw new Error('No redirect URL received from backend.');
        }

    } catch (err) {
        console.error(err);
        statusText.textContent = 'Error occurred.';
        errorLog.textContent = err.message;
        errorLog.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
    }
}

cancelBtn.addEventListener('click', () => {
    window.location.href = './';
});

// Init
loadSettings();
handleShare();
