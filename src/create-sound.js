// Simple script to create notification sounds using Web Audio API
// This creates a pleasant notification chime programmatically

function createNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.5;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create a pleasant chime sound with multiple tones
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Multiple sine waves for a richer sound
        const tone1 = Math.sin(2 * Math.PI * 523.25 * t); // C5
        const tone2 = Math.sin(2 * Math.PI * 659.25 * t); // E5
        const tone3 = Math.sin(2 * Math.PI * 783.99 * t); // G5
        
        // Envelope to fade in and out
        const envelope = Math.exp(-t * 3) * Math.sin(Math.PI * t / duration);
        
        data[i] = (tone1 + tone2 + tone3) * envelope * 0.1;
    }
    
    return buffer;
}

// Export for use in main app
window.createNotificationSound = createNotificationSound;