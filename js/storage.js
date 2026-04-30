export class StorageManager {
    constructor(channelName = 'casapepa_channel') {
        this.channel = new BroadcastChannel(channelName);
        this.listeners = [];

        // Listen for BroadcastChannel messages
        this.channel.onmessage = (event) => {
            this.notifyListeners(event.data);
        };

        // Fallback for Safari / other contexts via localStorage events
        window.addEventListener('storage', (event) => {
            if (event.key === 'casapepa_state_update') {
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
        localStorage.setItem(`casapepa_${key}`, payload);
        
        // Broadcast
        const message = { type: 'STATE_UPDATE', key, state };
        this.channel.postMessage(message);
        
        // Trigger storage event for same-browser other tabs if channel fails
        localStorage.setItem('casapepa_state_update', JSON.stringify({ ...message, timestamp: Date.now() }));
    }

    loadState(key) {
        const data = localStorage.getItem(`casapepa_${key}`);
        return data ? JSON.parse(data) : null;
    }
}

export const storage = new StorageManager();
