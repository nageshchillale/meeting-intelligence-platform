// Recorder Library to wrap MediaRecorder API

class MeetingRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  async start(stream) {
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    console.log("MediaRecorder started");
  }

  stop() {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, {
            type: "video/webm"
          });
          resolve(blob);
        };
        this.mediaRecorder.stop();
        console.log("MediaRecorder stopped");
      } else {
        resolve(null);
      }
    });
  }
}

// Export if using ES modules, or attach to global scope
if (typeof window !== 'undefined') {
    window.MeetingRecorder = MeetingRecorder;
}
