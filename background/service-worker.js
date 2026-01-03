let mediaRecorder;
let audioChunks = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    console.log('Starting audio capture...');
    
    chrome.tabCapture.capture({audio: true}, (stream) => {
      if (chrome.runtime.lastError) {
        console.error('Capture error:', chrome.runtime.lastError);
        sendResponse({status: 'error', message: chrome.runtime.lastError.message});
        return;
      }
      
      console.log('Audio stream captured successfully');
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('Audio chunk captured:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('Recording stopped. Total chunks:', audioChunks.length);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Final audio size:', audioBlob.size, 'bytes');
        
        // Save to Chrome storage or send to backend
        chrome.storage.local.set({ 'latestRecording': audioBlob });
        audioChunks = [];
      };
      
      mediaRecorder.start(1000); // Capture every second
      sendResponse({status: 'started'});
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'stopCapture') {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      sendResponse({status: 'stopped'});
    }
    return true;
  }
});
