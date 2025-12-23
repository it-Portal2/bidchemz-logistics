export const playNotificationSound = () => {
    // Check if AudioContext is supported
    if (typeof window === 'undefined') return;

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Sound characteristics for a soothing "ding"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // Ramp to C6 for a bell-like attack

        // Envelope for soft decay
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); // Long Decay

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 1.5);
    } catch (e) {
        console.error("Failed to play notification sound", e);
    }
};
