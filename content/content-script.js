console.log('Meeting Assistant: Content Script Loaded');

let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message.action);
  
  if (message.action === 'startCapture') {
    startRecording().then(() => {
      sendResponse({status: 'started', message: 'Recording started'});
    }).catch((error) => {
      console.error('Recording error:', error);
      sendResponse({status: 'error', message: error.message});
    });
    return true; // Keep channel open
  }
  
  if (message.action === 'stopCapture') {
    stopRecording().then(() => {
      sendResponse({status: 'stopped', message: 'Recording stopped'});
    }).catch((error) => {
      sendResponse({status: 'error', message: error.message});
    });
    return true;
  }
});

async function startRecording() {
  try {
    console.log('Requesting display media with audio...');
    
    // Must include video:true for Chrome, but we'll only use audio
    recordingStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'tab' // Prefer tab capture
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
    
    console.log('Stream obtained');
    console.log('Audio tracks:', recordingStream.getAudioTracks().length);
    console.log('Video tracks:', recordingStream.getVideoTracks().length);
    
    // Check if audio is available
    const audioTracks = recordingStream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio track captured. Please ensure "Share tab audio" is checked when sharing.');
    }
    
    // Stop video tracks immediately (we only need audio)
    recordingStream.getVideoTracks().forEach(track => {
      track.stop();
      console.log('Video track stopped (not needed)');
    });
    
    // Create audio-only stream
    const audioStream = new MediaStream(audioTracks);
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    
    console.log('Creating MediaRecorder with mimeType:', mimeType);
    
    mediaRecorder = new MediaRecorder(audioStream, { 
      mimeType: mimeType,
      audioBitsPerSecond: 128000
    });
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        console.log('Audio chunk captured:', event.data.size, 'bytes. Total:', audioChunks.length);
      }
    };
    
    mediaRecorder.onstop = async () => {
      console.log('Recording stopped. Total chunks:', audioChunks.length);
      
      if (audioChunks.length === 0) {
        console.warn('No audio data captured');
        return;
      }
      
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      console.log('Created audio blob. Size:', audioBlob.size, 'bytes');
      
      // Convert to base64 for Chrome storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        
        chrome.storage.local.set({
          latestRecording: base64Audio,
          recordingSize: audioBlob.size,
          recordingTime: new Date().toISOString(),
          mimeType: mimeType
        }, () => {
          console.log('✅ Recording saved to Chrome storage');
          
          // Notify background/popup
          chrome.runtime.sendMessage({
            action: 'recordingSaved',
            size: audioBlob.size
          }).catch(err => console.log('Background not listening:', err));
        });
      };
      reader.readAsDataURL(audioBlob);
      
      audioChunks = [];
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
    };
    
    mediaRecorder.start(1000); // Capture in 1-second chunks
    console.log('✅ MediaRecorder started. State:', mediaRecorder.state);
    
  } catch (error) {
    console.error('Failed to start recording:', error);
    if (error.name === 'NotAllowedError') {
      throw new Error('Permission denied. Please allow screen sharing and check "Share tab audio".');
    }
    throw error;
  }
}

async function stopRecording() {
  if (!mediaRecorder) {
    throw new Error('No active recording');
  }
  
  if (mediaRecorder.state === 'inactive') {
    throw new Error('Recording already stopped');
  }
  
  console.log('Stopping MediaRecorder...');
  mediaRecorder.stop();
  
  // Stop all tracks
  if (recordingStream) {
    recordingStream.getTracks().forEach(track => {
      track.stop();
      console.log('Track stopped:', track.kind);
    });
  }
  
  console.log('✅ Recording stopped successfully');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (recordingStream) {
    recordingStream.getTracks().forEach(track => track.stop());
  }
});
