// Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// State management
let state = {
    context: null,
    event: null,
    medium: null,
    user_input: null,
    isCustom: false,
    currentStep: 1,
    availableEvents: []
};

// DOM elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const customContainer = document.getElementById('customContainer');
const customLink = document.getElementById('customLink');
const backLink = document.getElementById('backLink');
const customInput = document.getElementById('customInput');
const customGenerate = document.getElementById('customGenerate');
const eventOptions = document.getElementById('eventOptions');
const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const excuseContainer = document.getElementById('excuseContainer');
const excuseList = document.getElementById('excuseList');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');
const copyFeedback = document.getElementById('copyFeedback');
const loadingSpinner = document.getElementById('loadingSpinner');
const progressDots = document.querySelectorAll('.progress-dot');

// Utility functions
function showLoading() {
    loadingSpinner.classList.add('active');
}

function hideLoading() {
    loadingSpinner.classList.remove('active');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Add new error message
    const activeStep = document.querySelector('.step.active') || step3;
    activeStep.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Update progress indicator
function updateProgress(step) {
    progressDots.forEach((dot, index) => {
        if (index < step) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// API functions
async function fetchEventOptions(context) {
    try {
        const response = await fetch(`${API_BASE_URL}/options/${context}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch options: ${response.statusText}`);
        }
        const data = await response.json();
        return data.events;
    } catch (error) {
        console.error('Error fetching event options:', error);
        showError('Failed to load event options. Please try again.');
        return [];
    }
}

async function generateExcuse() {
    try {
        showLoading();
        
        const requestData = {
            context: state.isCustom ? 'custom' : state.context,
            event: state.isCustom ? null : state.event,
            medium: state.medium,
            user_input: state.isCustom ? state.user_input : null
        };

        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            throw new Error(errorData.detail || 'Failed to generate excuse');
        }
        const data = await response.json();
        console.log('API response data:', data); // Debug log
        displayExcuse(data.excuse);
        
    } catch (error) {
        console.error('Error generating excuse:', error);
        showError(error.message || 'Failed to generate excuse. Please try again.');
    } finally {
        hideLoading();
    }
}

// UI functions
function displayExcuse(excuse) {
    console.log('Displaying excuse:', excuse); // Debug log
    
    if (!excuse || typeof excuse !== 'string') {
        console.error('Invalid excuse data:', excuse);
        showError('Received invalid excuse data');
        return;
    }
    
    const excuseCard = document.createElement('div');
    excuseCard.className = 'excuse-card';
    
    // Create text element safely to avoid HTML injection issues
    const excuseTextDiv = document.createElement('div');
    excuseTextDiv.className = 'excuse-text';
    excuseTextDiv.textContent = excuse; // Use textContent instead of innerHTML
    
    excuseCard.appendChild(excuseTextDiv);
    
    excuseList.innerHTML = '';
    excuseList.appendChild(excuseCard);
    
    excuseContainer.classList.add('active');
    resetBtn.classList.add('active');
}

function populateEventOptions(events) {
    eventOptions.innerHTML = '';
    
    events.forEach(event => {
        const button = document.createElement('button');
        button.className = 'toggle-btn';
        button.dataset.value = event;
        button.textContent = event.charAt(0).toUpperCase() + event.slice(1);
        eventOptions.appendChild(button);
        
        button.addEventListener('click', function() {
            eventOptions.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            state.event = this.dataset.value;
            setTimeout(() => showStep3(), 300);
        });
    });
}

// Step navigation functions
async function showStep2() {
    // Fetch dynamic options for the selected context
    const events = await fetchEventOptions(state.context);
    if (events.length === 0) {
        return; // Error already shown in fetchEventOptions
    }
    
    state.availableEvents = events;
    populateEventOptions(events);
    
    step1.classList.remove('active');
    customContainer.classList.remove('active');
    setTimeout(() => {
        step1.style.display = 'none';
        customContainer.style.display = 'none';
        step2.style.display = 'block';
        setTimeout(() => {
            step2.classList.add('active');
            state.currentStep = 2;
            updateProgress(2);
        }, 50);
    }, 400);
}

function showStep3() {
    step2.classList.remove('active');
    setTimeout(() => {
        step2.style.display = 'none';
        step3.style.display = 'block';
        generateBtn.disabled = true;
        setTimeout(() => {
            step3.classList.add('active');
            state.currentStep = 3;
            updateProgress(3);
        }, 50);
    }, 400);
}

function showStep3FromCustom() {
    customContainer.classList.remove('active');
    setTimeout(() => {
        customContainer.style.display = 'none';
        step3.style.display = 'block';
        generateBtn.disabled = true;
        setTimeout(() => {
            step3.classList.add('active');
            state.currentStep = 3;
            updateProgress(3);
        }, 50);
    }, 400);
}

// Copy to clipboard functionality
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or non-HTTPS
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }
        
        // Show feedback
        copyFeedback.classList.add('show');
        setTimeout(() => {
            copyFeedback.classList.remove('show');
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showError('Failed to copy to clipboard');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Handle context selection (Step 1)
    step1.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            step1.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            state.context = this.dataset.value;
            state.isCustom = false;
            setTimeout(() => showStep2(), 300);
        });
    });

    // Handle custom link
    customLink.addEventListener('click', function(e) {
        e.preventDefault();
        step1.style.display = 'none';
        customContainer.classList.add('active');
        state.isCustom = true;
        customInput.focus();
    });

    // Handle back link
    backLink.addEventListener('click', function(e) {
        e.preventDefault();
        customContainer.classList.remove('active');
        setTimeout(() => {
            customContainer.style.display = 'none';
            step1.style.display = 'block';
            step1.classList.add('active');
        }, 300);
        state.isCustom = false;
        customInput.value = '';
    });

    // Handle custom generate
    customGenerate.addEventListener('click', function() {
        if (customInput.value.trim()) {
            state.user_input = customInput.value.trim();
            state.isCustom = true;
            setTimeout(() => showStep3FromCustom(), 300);
        }
    });

    // Handle format selection (Step 3)
    step3.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            step3.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            state.medium = this.dataset.value;
            generateBtn.disabled = false;
        });
    });

    // Handle generate button
    generateBtn.addEventListener('click', generateExcuse);

    // Handle regenerate button
    regenerateBtn.addEventListener('click', generateExcuse);

    // Handle copy button
    copyBtn.addEventListener('click', function() {
        const excuseText = excuseList.querySelector('.excuse-text')?.textContent;
        if (excuseText) {
            copyToClipboard(excuseText);
        }
    });

    // Handle reset button
    resetBtn.addEventListener('click', function() {
        // Reset state
        state = {
            context: null,
            event: null,
            medium: null,
            user_input: null,
            isCustom: false,
            currentStep: 1,
            availableEvents: []
        };
        
        // Reset all selections
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('selected'));
        customInput.value = '';
        
        // Remove error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Hide everything
        step2.classList.remove('active');
        step3.classList.remove('active');
        customContainer.classList.remove('active');
        excuseContainer.classList.remove('active');
        resetBtn.classList.remove('active');
        
        setTimeout(() => {
            step2.style.display = 'none';
            step3.style.display = 'none';
            customContainer.style.display = 'none';
            excuseContainer.style.display = 'none';
            step1.style.display = 'block';
            setTimeout(() => {
                step1.classList.add('active');
                updateProgress(1);
            }, 50);
        }, 400);
    });

    // Enable generate on Enter for custom input
    customInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            customGenerate.click();
        }
    });
});