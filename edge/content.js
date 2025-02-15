// Function to transform text for WhatsApp
function transformTextForWhatsApp(text) {
  console.log('Original text:', text);
  // Get settings first
  return chrome.storage.sync.get('formatterSettings').then(data => {
    const settings = data.formatterSettings || {
      boldFormat: true,
      headerFormat: true,
      preserveMath: true,
      cleanNewlines: true
    };
    
    console.log('Using settings:', settings);
    
    // Apply transformations based on settings
    if (settings.headerFormat) {
      // Replace multiple hashes with single hash, preserving one space after
      text = text.replace(/^#{2,}\s*/gm, "# ");
    }
  
    if (settings.preserveMath) {
      // Replace double asterisks with single asterisk, but not inside math expressions
      let segments = text.split('$');
      for (let i = 0; i < segments.length; i++) {
        // Only transform text in even-indexed segments (outside math expressions)
        if (i % 2 === 0 && settings.boldFormat) {
          segments[i] = segments[i].replace(/\*\*(.*?)\*\*/g, "*$1*");
        }
      }
      text = segments.join('$');
    } else if (settings.boldFormat) {
      // If not preserving math expressions, just replace all double asterisks
      text = text.replace(/\*\*(.*?)\*\*/g, "*$1*");
    }
  
    if (settings.cleanNewlines) {
      // Clean up multiple newlines
      text = text.replace(/\n{3,}/g, '\n\n');
    }
  
    console.log('Transformed text:', text);
    return text;
  });
}

// Function to handle the copy event
function handleCopy(event) {
  let textContent;
  
  // If this is a clipboard event
  if (event.type === 'copy') {
    // Get the selected text
    textContent = window.getSelection().toString();
  } else {
    // If this is a button click
    const responseElement = event.target.closest('.chat-message-item');
    if (!responseElement) return;
    textContent = responseElement.querySelector('.markdown-content').textContent;
  }
  
  if (!textContent) return;
  
  // Transform the text (now returns a promise)
  transformTextForWhatsApp(textContent).then(transformedText => {
    // Copy to clipboard
    return navigator.clipboard.writeText(transformedText);
  }).then(() => {
    // Show success message only for button clicks
    if (event.type !== 'copy' && event.target) {
      const originalButtonText = event.target.textContent;
      event.target.textContent = 'Formatted & Copied!';
      setTimeout(() => {
        event.target.textContent = originalButtonText;
      }, 2000);
    }
  })
  .catch(err => console.error('Failed to copy:', err));
  
  // Prevent default copy behavior
  event.preventDefault();
  event.stopPropagation();
}

// Function to initialize the extension
function initializeExtension() {
  // Listen for our custom whatsappFormat event
  document.addEventListener('whatsappFormat', async (event) => {
    const text = event.detail.text;
    if (!text) return;
    
    console.log('Received text to format:', text);
    
    try {
      // Transform the text
      const transformedText = await transformTextForWhatsApp(text);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(transformedText);
      console.log('Formatted text copied to clipboard');
      
    } catch (error) {
      console.error('Error in format process:', error);
    }
  });
}

// Initialize when the page loads
if (document.readyState === 'loading') {
  console.log('Page loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  console.log('Page already loaded, initializing now');
  initializeExtension();
} 