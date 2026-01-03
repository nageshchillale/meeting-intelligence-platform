document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({action: 'startCapture'}, (response) => {
    document.getElementById('status').textContent = 
      'Status: ' + (response.status === 'started' ? 'Recording...' : 'Error: ' + response.message);
  });
});

document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({action: 'stopCapture'}, (response) => {
    document.getElementById('status').textContent = 'Status: Recording stopped';
  });
});

