console.log('WhatsApp Formatter: Extension loaded');

// Easter egg
console.log('This extension was crafted with care by Sheharyar! Check out my GitHub: https://github.com/Shery-1508');

// Store settings in a global variable
let currentSettings = {
    boldFormat: true,
    headerFormat: true,
    mathFormat: true,
    preserveSpacing: true,
    smartLinks: true,
    tableFormat: true,
    listFormat: true,
    smartFormat: true
};

// Create the script content with proper escaping
const scriptContent = `
console.log('WhatsApp Formatter: Script injected');

// For debugging - add to window object
window.whatsappFormatter = {
    originalText: null,
    formattedText: null,
    settings: ${JSON.stringify(currentSettings)},
    customRules: []
};

// Store the original clipboard writeText function
const originalWriteText = navigator.clipboard.writeText;

// Override clipboard writeText
navigator.clipboard.writeText = async function(text) {
    console.log('WhatsApp Formatter: Clipboard write intercepted');
    window.whatsappFormatter.originalText = text;

    // Check if this is a copy operation from the chat
    if (text.includes('**') || text.includes('###') || text.includes('$')) {
        // Format the text
        let formattedText = text;
        
        console.log('WhatsApp Formatter: Starting text transformation');
        console.log('Current settings:', window.whatsappFormatter.settings);
        
        const settings = window.whatsappFormatter.settings;
        
        // Apply custom rules first
        if (window.whatsappFormatter.customRules.length > 0) {
            window.whatsappFormatter.customRules.forEach(rule => {
                try {
                    if (rule.type === 'regex') {
                        const regex = new RegExp(rule.find, 'g');
                        formattedText = formattedText.replace(regex, rule.replace);
                    } else {
                        // Use regex for case-sensitive text replacement
                        const escapedFind = rule.find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\\\$&');
                        const regex = new RegExp(escapedFind, 'g');
                        formattedText = formattedText.replace(regex, rule.replace);
                    }
                    console.log('Applied custom rule:', rule.find, '→', rule.replace);
                } catch (err) {
                    console.log('Error applying custom rule:', err);
                }
            });
            console.log('Applied custom rules');
        }
        
        // Apply smart formatting
        if (settings.smartFormat) {
            Object.keys(window.whatsappFormatter.smartFormatting).forEach(type => {
                try {
                    formattedText = window.whatsappFormatter.smartFormatting[type](formattedText);
                } catch (err) {
                    console.log('Error applying smart format:', type, err);
                }
            });
            console.log('Applied smart formatting');
        }
        
        // Apply transformations based on settings
        if (settings.headerFormat === true) {
            formattedText = formattedText.replace(/^#{2,}\\s*/gm, "# ");
            console.log('Applied header format');
        }
        
        if (settings.mathFormat === true) {
            formattedText = formattedText.replace(/\\$\\s*([^$]+?)\\s*\\$/g, (match, p1) => {
                // Remove extra spaces
                let expr = p1.trim();
                
                // Common LaTeX replacements
                expr = expr
                    // Basic operators and symbols
                    .replace(/\\\\cdot/g, '⋅')
                    .replace(/\\\\times/g, '×')
                    .replace(/\\\\div/g, '÷')
                    .replace(/\\\\pm/g, '±')
                    .replace(/\\\\infty/g, '∞')
                    
                    // Greek letters
                    .replace(/\\\\alpha/g, 'α')
                    .replace(/\\\\beta/g, 'β')
                    .replace(/\\\\theta/g, 'θ')
                    .replace(/\\\\omega/g, 'ω')
                    
                    // Functions
                    .replace(/\\\\sin(?![a-z])/g, 'sin')
                    .replace(/\\\\cos(?![a-z])/g, 'cos')
                    .replace(/\\\\tan(?![a-z])/g, 'tan')
                    .replace(/\\\\log(?![a-z])/g, 'log')
                    .replace(/\\\\lim(?![a-z])/g, 'lim')
                    .replace(/\\\\int(?![a-z])/g, '∫')
                    
                    // Superscripts and subscripts
                    .replace(/\\^2/g, '²')  // Common squares
                    .replace(/\\^3/g, '³')  // Common cubes
                    .replace(/\\^(\\d)/g, '^$1')  // Other single digit superscripts
                    .replace(/\\^{([^}]+)}/g, '^$1')  // Multi-digit superscripts
                    .replace(/_(\\d)/g, '_$1')  // Single digit subscripts
                    .replace(/_{([^}]+)}/g, '_$1')  // Multi-digit subscripts
                    
                    // Fractions
                    .replace(/\\\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
                    
                    // Arrows and relations
                    .replace(/\\\\to/g, '→')
                    .replace(/\\\\rightarrow/g, '→')
                    .replace(/\\\\leftarrow/g, '←')
                    .replace(/\\\\leq/g, '≤')
                    .replace(/\\\\geq/g, '≥')
                    .replace(/\\\\neq/g, '≠')
                    
                    // Sets and logic
                    .replace(/\\\\in/g, '∈')
                    .replace(/\\\\subset/g, '⊂')
                    .replace(/\\\\cup/g, '∪')
                    .replace(/\\\\cap/g, '∩')
                    .replace(/\\\\forall/g, '∀')
                    .replace(/\\\\exists/g, '∃')
                    
                    // Clean up spaces
                    .replace(/\\s*([+\\-=<>])\\s*/g, ' $1 ')  // Space around operators
                    .replace(/([_^])\\s+/g, '$1')  // Remove spaces after sub/superscripts
                    
                    // Fix common patterns
                    .replace(/\\\\lim_([^{]+?)\\\\to/g, 'lim[→]')  // Limits
                    .replace(/\\\\int_([^{]+?)\\^/g, '∫[')  // Integrals
                    .replace(/sin\\^2/g, 'sin²')  // Common trig patterns
                    .replace(/cos\\^2/g, 'cos²')
                    
                    // Final cleanup
                    .replace(/\\s+/g, ' ')
                    .trim();
                
                return expr;
            });
            console.log('Applied math format');
        }
        
        if (settings.boldFormat === true) {
            formattedText = formattedText.replace(/\\*\\*(.*?)\\*\\*/g, "*$1*");
            console.log('Applied bold format');
        }
        
        if (settings.preserveSpacing === false) {
            formattedText = formattedText.replace(/\\n{4,}/g, '\\n\\n\\n');
            console.log('Applied spacing format');
        }
        
        // Add to the clipboard writeText function
        if (settings.tableFormat === true && formattedText.includes('|') && formattedText.includes('\\n')) {
            // Remove table dividers (rows with only |-:)
            formattedText = formattedText.replace(/\\|[-:\\s|]+\\|\\n/g, '');
            
            // Convert table rows to bullet points
            formattedText = formattedText.replace(
                /\\|([^\\n|]+)\\|/g, 
                function(match, content) { return '• ' + content.trim() + '\\n'; }
            );
            
            // Clean up any leftover table formatting
            formattedText = formattedText
                .replace(/^\\s*\\|\\s*/gm, '')  // Remove leading pipe
                .replace(/\\s*\\|\\s*$/gm, '')  // Remove trailing pipe
                .replace(/\\s*\\|\\s*/g, ' | '); // Clean up internal pipes
            
            console.log('Applied table format');
        }
        
        // Add numbered list formatting
        if (settings.listFormat === true) {
            // Convert "1. " to "1) "
            formattedText = formattedText.replace(
                /^\\d+\\.\\s+/gm,
                match => match.replace('.', ')')
            );
            console.log('Applied list format');
        }
        
        // Convert long URLs to cleaner format
        if (settings.smartLinks === true) {
            formattedText = formattedText.replace(
                /\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g,
                '$1 ($2)'
            );
            console.log('Applied link format');
        }
        
        window.whatsappFormatter.formattedText = formattedText;
        console.log('WhatsApp Formatter: Text transformed successfully');
        
        // Show visual feedback
        const notification = document.createElement('div');
        notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #128C7E;
            color: white;
            border-radius: 5px;
            z-index: 9999;
        \`;
        notification.textContent = 'Text formatted for WhatsApp!';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
        
        // Add to clipboard function
        if (formattedText.length > 65536) { // WhatsApp message limit
            notification.style.backgroundColor = '#FFA500';
            notification.textContent = 'Warning: Message too long for WhatsApp!';
        }
        
        return originalWriteText.call(navigator.clipboard, formattedText);
    }
    
    return originalWriteText.call(navigator.clipboard, text);
};

// Function to update settings
window.updateWhatsAppFormatterSettings = function(newSettings) {
    console.log('Updating settings:', newSettings);
    window.whatsappFormatter.settings = newSettings;
    console.log('WhatsApp Formatter: Settings updated in page', newSettings);
};

// Smart formatting patterns
window.whatsappFormatter.smartFormatting = {
    emails: function(text) {
        return text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]+)/g, '*$1*');
    },
    phones: function(text) {
        return text.replace(/\\+(\\d{1,3}[-\\s]?)?\\(?\\d{1,3}\\)?[-\\s]?\\d{1,4}[-\\s]?\\d{1,4}/g, '*$1*');
    },
    dates: function(text) {
        return text.replace(/(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})/g, '_$1_');
    }
};
`;

// Create and inject the script
const script = document.createElement('script');
script.textContent = scriptContent;
document.documentElement.prepend(script);
script.remove();

// Listen for window messages (from popup)
window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'settingsUpdated') {
        const updateScript = document.createElement('script');
        updateScript.textContent = `window.updateWhatsAppFormatterSettings(${JSON.stringify(event.data.settings)})`;
        document.documentElement.appendChild(updateScript);
        updateScript.remove();
        console.log('Settings updated from message:', event.data.settings);
    } else if (event.data.type === 'customRulesUpdated') {
        const updateScript = document.createElement('script');
        updateScript.textContent = `window.whatsappFormatter.customRules = ${JSON.stringify(event.data.rules)}`;
        document.documentElement.appendChild(updateScript);
        updateScript.remove();
        console.log('Custom rules updated:', event.data.rules);
    }
});

// Also try to intercept the copy button click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-response-button')) {
        console.log('WhatsApp Formatter: Copy button clicked');
    }
}, true);

const styleContent = `
    button.copy-response-button {
        background: none !important;
        position: relative !important;
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 4px !important;
    }
    button.copy-response-button svg {
        display: none !important;
    }
    button.copy-response-button::after {
        content: '';
        width: 28px !important;
        height: 28px !important;
        opacity: 0.8;
        background-image: url('data:image/svg+xml;base64,${btoa(`<?xml version="1.0" encoding="utf-8"?>
<!-- License: PD. Made by Mary Akveo: https://maryakveo.com/ -->
<svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" id="file-favorite-7" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><path id="secondary" d="M5,5V3H16a1,1,0,0,1,1,1V9A8.49,8.49,0,0,0,9.26,21H4a1,1,0,0,1-1-1V5Z" style="fill: rgb(44, 169, 188); stroke-width: 2;"></path><path id="primary" d="M10,21H4a1,1,0,0,1-1-1V5L5,3H16a1,1,0,0,1,1,1v6" style="fill: none; stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
  
  <path id="primary-2" data-name="primary" d="M17,14l-1.24,2.3L13,16.67l2,1.8L14.53,21,17,19.8,19.47,21,19,18.47l2-1.8-2.76-.37ZM7,9h3M5,3V5H3Z" 
style="fill: none; 
stroke: rgb(0, 0, 0); 
stroke-linecap: round; 
stroke-linejoin: round; 
stroke-width: 2;"></path>
    <!-- WhatsApp Icon in place of Lock, aligned properly and changed color -->
    <g transform="translate(10.4,11) scale(0.55)">
        <path id="secondary" d="M10.54,3.12A9,9,0,0,0,4,16.12L3,21l4.88-1A9,9,0,1,0,10.54,3.12ZM8.68,10.94A5.27,5.27,0,0,1,8,8H9.81l.4,1.4ZM16,16a5.27,5.27,0,0,1-2.94-.66l1.54-1.53,1.4.4Z" style="fill: rgb(37, 211, 102); stroke-width: 2;"></path>
        <path id="primary" d="M8.68,10.94,10.21,9.4,9.81,8H8s-.41,2.54,2.52,5.46S16,16,16,16V14.19l-1.4-.4-1.54,1.53" style="fill: white; stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
        <path id="primary-2" data-name="primary" d="M20.88,13.46A9,9,0,0,1,7.88,20L3,21l1-4.88a9,9,0,1,1,16.88-2.66Z" style="fill: none; stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path>
    </g>

</svg>`)}') !important;
        background-size: contain !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
        display: block !important;
    }
    button.copy-response-button:hover::after {
        opacity: 1;
    }
`;

// Wait for document to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
} else {
    injectStyles();
}

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = styleContent;
    document.head?.appendChild(style);
}

