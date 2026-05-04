export class StorageManager {
    constructor(channelName = 'zambrana_channel') {
        this.channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(channelName) : null;
        this.listeners = [];

        // Listen for BroadcastChannel messages
        if (this.channel) {
            this.channel.onmessage = (event) => {
                this.notifyListeners(event.data);
            };
        }

        // Fallback for Safari / other contexts via localStorage events
        window.addEventListener('storage', (event) => {
            if (event.key === 'zambrana_state_update') {
                try {
                    const data = JSON.parse(event.newValue);
                    this.notifyListeners(data);
                } catch (e) {
                    console.error('Error parsing storage event', e);
                }
            }
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    unsubscribe(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(cb => cb(data));
    }

    // Save to LocalStorage and broadcast update
    saveState(key, state) {
        const payload = JSON.stringify(state);
        localStorage.setItem(`zambrana_${key}`, payload);
        
        // Broadcast
        const message = { type: 'STATE_UPDATE', key, state };
        if (this.channel) {
            this.channel.postMessage(message);
        }
        
        // Trigger storage event for same-browser other tabs if channel fails
        localStorage.setItem('zambrana_state_update', JSON.stringify({ ...message, timestamp: Date.now() }));
    }

    loadState(key) {
        const data = localStorage.getItem(`zambrana_${key}`);
        return data ? JSON.parse(data) : null;
    }
}

export const storage = new StorageManager();
