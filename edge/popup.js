// Custom rules handling
let customRules = [];

function saveSettings() {
  const settings = {
    boldFormat: document.getElementById('boldFormat')?.checked || false,
    headerFormat: document.getElementById('headerFormat')?.checked || false,
    mathFormat: document.getElementById('mathFormat')?.checked || false,
    codeFormat: document.getElementById('codeFormat')?.checked || false,
    smartFormat: document.getElementById('smartFormat')?.checked || false,
    tableFormat: document.getElementById('tableFormat')?.checked || false,
    listFormat: document.getElementById('listFormat')?.checked || false,
    preserveSpacing: document.getElementById('preserveSpacing')?.checked || false,
    smartLinks: document.getElementById('smartLinks')?.checked || false
  };
  
  chrome.storage.sync.set({ formatterSettings: settings }, () => {
    showStatus('Settings saved!');
    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        try {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (settings) => {
              window.postMessage({ 
                type: 'settingsUpdated', 
                settings: settings 
              }, '*');
            },
            args: [settings]
          });
          console.log('Settings updated:', settings);
        } catch (err) {
          console.log('Error sending settings:', err);
        }
      }
    });
  });
}

function loadSettings() {
  chrome.storage.sync.get('formatterSettings', (data) => {
    const settings = data.formatterSettings || {
      boldFormat: true,
      headerFormat: true,
      mathFormat: true,
      codeFormat: true,
      smartFormat: true,
      tableFormat: true,
      listFormat: true,
      preserveSpacing: false,
      smartLinks: true
    };
    
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.checked = settings[key];
        // Add change listener to each checkbox
        element.addEventListener('change', saveSettings);
      }
    });
  });
}

function loadCustomRules() {
  chrome.storage.sync.get('customRules', (data) => {
    customRules = data.customRules || [];
    renderCustomRules();
  });
}

function saveCustomRules() {
  chrome.storage.sync.set({ customRules }, () => {
    showStatus('Custom rules saved!');
    // Send to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        try {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (rules) => {
              window.postMessage({ 
                type: 'customRulesUpdated', 
                rules: rules 
              }, '*');
            },
            args: [customRules]
          }).catch(() => {
            console.log('Content script not ready, rules will be loaded on next page load');
          });
          console.log('Custom rules sent to page:', customRules);
        } catch (err) {
          console.log('Failed to send custom rules:', err);
          showStatus('Custom rules saved! Refresh page to apply.');
        }
      }
    });
  });
}

function renderCustomRules() {
  const container = document.getElementById('customRulesContainer');
  container.innerHTML = '';
  
  customRules.forEach((rule, index) => {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule';
    ruleDiv.innerHTML = `
      <input type="text" class="find" value="${rule.find}" placeholder="Find">
      <input type="text" class="replace" value="${rule.replace}" placeholder="Replace with">
      <select class="type">
        <option value="text" ${rule.type === 'text' ? 'selected' : ''}>Text</option>
        <option value="regex" ${rule.type === 'regex' ? 'selected' : ''}>Regex</option>
      </select>
      <button class="delete-rule" data-index="${index}">&times;</button>
    `;
    container.appendChild(ruleDiv);
  });

  // Add event listeners
  document.querySelectorAll('.rule input, .rule select').forEach(el => {
    el.addEventListener('change', updateRule);
  });
  
  document.querySelectorAll('.delete-rule').forEach(btn => {
    btn.addEventListener('click', deleteRule);
  });
}

function addRule() {
  customRules.push({
    find: '',
    replace: '',
    type: 'text'
  });
  renderCustomRules();
  saveCustomRules();
}

function updateRule(event) {
  const ruleDiv = event.target.closest('.rule');
  const index = Array.from(ruleDiv.parentNode.children).indexOf(ruleDiv);
  
  customRules[index] = {
    find: ruleDiv.querySelector('.find').value,
    replace: ruleDiv.querySelector('.replace').value,
    type: ruleDiv.querySelector('.type').value
  };
  
  saveCustomRules();
}

function deleteRule(event) {
  const index = event.target.dataset.index;
  customRules.splice(index, 1);
  renderCustomRules();
  saveCustomRules();
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadCustomRules();
  
  // Add event listeners for checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
  
  // Add other event listeners
  document.getElementById('addRule')?.addEventListener('click', addRule);
  document.getElementById('previewBtn')?.addEventListener('click', togglePreview);
  document.getElementById('exportBtn')?.addEventListener('click', exportSettings);
  document.getElementById('importBtn')?.addEventListener('click', importSettings);
  
  // Add preview input listener
  document.getElementById('previewInput')?.addEventListener('input', (e) => {
    const input = e.target.value;
    const output = document.getElementById('previewOutput');
    
    // Get current settings
    chrome.storage.sync.get(['formatterSettings', 'customRules'], (data) => {
      const settings = data.formatterSettings || {};
      const rules = data.customRules || [];
      
      // Apply formatting (simplified version of main formatter)
      let formatted = input;
      if (settings.boldFormat) {
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "*$1*");
      }
      if (settings.headerFormat) {
        formatted = formatted.replace(/^#{2,}\s*/gm, "# ");
      }
      // Apply custom rules
      rules.forEach(rule => {
        try {
          if (rule.type === 'regex') {
            const regex = new RegExp(rule.find, 'g');
            formatted = formatted.replace(regex, rule.replace);
          } else {
            formatted = formatted.split(rule.find).join(rule.replace);
          }
        } catch (err) {
          console.log('Error applying rule:', err);
        }
      });
      
      output.textContent = formatted;
    });
  });
  
  // Add collapse functionality
  document.getElementById('customRulesHeader')?.addEventListener('click', toggleCustomRules);
  
  // Load collapse state
  chrome.storage.sync.get('customRulesCollapsed', (data) => {
    if (data.customRulesCollapsed) {
      document.getElementById('customRulesHeader')?.classList.add('collapsed');
      document.getElementById('customRulesContent')?.classList.add('collapsed');
    }
  });
});

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.display = 'block';
  status.style.backgroundColor = isError ? '#dc3545' : '#128C7E';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 2000);
}

function togglePreview() {
  const previewArea = document.getElementById('previewArea');
  previewArea.classList.toggle('active');
}

function toggleCustomRules() {
  const header = document.getElementById('customRulesHeader');
  const content = document.getElementById('customRulesContent');
  header.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
  
  // Save state
  chrome.storage.sync.set({
    customRulesCollapsed: header.classList.contains('collapsed')
  });
}

function exportSettings() {
  chrome.storage.sync.get(['formatterSettings', 'customRules'], (data) => {
    const exportData = {
      settings: data.formatterSettings,
      rules: data.customRules
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qwen-formatter-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        chrome.storage.sync.set({
          formatterSettings: data.settings,
          customRules: data.rules
        }, () => {
          loadSettings();
          loadCustomRules();
          showStatus('Settings imported!');
        });
      } catch (error) {
        showStatus('Error importing settings!', true);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
} 