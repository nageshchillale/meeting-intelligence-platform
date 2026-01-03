console.log('🎙️ Meeting Assistant service worker loaded');

// Listen for recording saved notifications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'recordingSaved') {
    console.log('Recording saved! Size:', message.size, 'bytes');
    
    // Here you can add logic to send to backend
    // sendToBackend(recording);
  }
});
