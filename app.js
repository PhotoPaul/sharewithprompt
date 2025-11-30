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
    navigator.serviceWorker.register('./sw.js')
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
                navigator.serviceWorker.register('./sw.js')
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

            const resultSection = document.getElementById('result-section');
            const resultText = document.getElementById('result-text');
            const homeBtn = document.getElementById('home-btn');

            // Handle Shared Image
            async function handleShare() {
                const urlParams = new URLSearchParams(window.location.search);
                if (!urlParams.has('share')) return;

                // Switch UI to processing mode
                settingsSection.classList.add('hidden');
                processingSection.classList.remove('hidden');
                resultSection.classList.add('hidden');

                try {
                    const imageBlob = await get('shared-image');
                    if (!imageBlob) {
                        throw new Error('No shared image found in storage.');
                    }

                    statusText.textContent = 'Image found. Preparing to send...';

                    const apiKey = localStorage.getItem('gemini_api_key');
                    const gasUrl = localStorage.getItem('gas_url');
                    const prompt = localStorage.getItem('custom_prompt') || 'extract as a csv all visible transactions in this screenshot. amounts use "," instead of "." so fix this.';

                    if (!apiKey || !gasUrl) {
                        throw new Error('Missing API Key or GAS URL. Please configure settings first.');
                    }

                    const base64Image = await blobToBase64(imageBlob);

                    statusText.textContent = 'Analyzing with Gemini...';

                    // Send to GAS
                    const response = await fetch(gasUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            image: base64Image,
                            key: apiKey,
                            prompt: prompt,
                            mimeType: imageBlob.type
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.error) {
                        throw new Error(result.error);
                    }

                    // Show Result
                    processingSection.classList.add('hidden');
                    resultSection.classList.remove('hidden');
                    resultText.value = result.text;

                    // Clean up
                    await del('shared-image');

                } catch (err) {
                    console.error(err);
                    statusText.textContent = 'Error occurred.';
                    errorLog.textContent = err.message;
                    errorLog.classList.remove('hidden');
                    cancelBtn.classList.remove('hidden');
                }
            }

            // Copy to clipboard on click
            resultText.addEventListener('click', async () => {
                resultText.select();
                try {
                    await navigator.clipboard.writeText(resultText.value);
                    // Visual feedback
                    const originalTitle = document.querySelector('#result-section h2').textContent;
                    document.querySelector('#result-section h2').textContent = 'Copied!';
                    setTimeout(() => {
                        document.querySelector('#result-section h2').textContent = originalTitle;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });

            homeBtn.addEventListener('click', () => {
                window.location.href = './';
            });

            cancelBtn.addEventListener('click', () => {
                window.location.href = './';
            });

            // Init
            loadSettings();
            handleShare();
