document.getElementById('startBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Starting...';
  statusDiv.style.background = '#fff3cd';
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab) {
      throw new Error('No active tab');
    }
    
    // Check if it's a meeting page
    const isMeetingTab = tab.url.includes('meet.google.com') || 
                         tab.url.includes('zoom.us') || 
                         tab.url.includes('teams.microsoft.com');
    
    if (!isMeetingTab) {
      statusDiv.textContent = 'Error: Please open Google Meet, Zoom, or Teams';
      statusDiv.style.background = '#f8d7da';
      return;
    }
    
    // Send message to content script in the active tab
    chrome.tabs.sendMessage(tab.id, {action: 'startCapture'}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        statusDiv.style.background = '#f8d7da';
        return;
      }
      
      if (response && response.status === 'started') {
        statusDiv.textContent = '🎙️ Recording...';
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
      } else {
        statusDiv.textContent = 'Error: ' + (response?.message || 'Failed to start');
        statusDiv.style.background = '#f8d7da';
      }
    });
    
  } catch (error) {
    console.error('Start error:', error);
    statusDiv.textContent = 'Error: ' + error.message;
    statusDiv.style.background = '#f8d7da';
  }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Stopping...';
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    chrome.tabs.sendMessage(tab.id, {action: 'stopCapture'}, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        statusDiv.style.background = '#f8d7da';
        return;
      }
      
      if (response && response.status === 'stopped') {
        statusDiv.textContent = '✅ Recording saved!';
        statusDiv.style.background = '#d1ecf1';
        statusDiv.style.color = '#0c5460';
      } else {
        statusDiv.textContent = 'Error: ' + (response?.message || 'Failed to stop');
        statusDiv.style.background = '#f8d7da';
      }
    });
    
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    statusDiv.style.background = '#f8d7da';
  }
});
