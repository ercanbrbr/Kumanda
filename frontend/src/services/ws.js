/**
 * WebSocket manager for the mousepad.
 * Auto-reconnects on disconnect. Sends JSON events to /ws/mouse.
 */

const WS_URL = () => {
    const { protocol, hostname, port } = window.location;
    const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${hostname}:${port}/ws/mouse`;
};

class MouseWebSocket {
    constructor() {
        this.ws = null;
        this.reconnectTimer = null;
        this.shouldConnect = false;
    }

    connect() {
        this.shouldConnect = true;
        this._open();
    }

    _open() {
        if (this.ws) return;
        this.ws = new WebSocket(WS_URL());

        this.ws.onopen = () => {
            console.log('[Kumanda] MouseWS connected');
            clearTimeout(this.reconnectTimer);
        };

        this.ws.onclose = () => {
            console.log('[Kumanda] MouseWS closed, reconnecting...');
            this.ws = null;
            if (this.shouldConnect) {
                this.reconnectTimer = setTimeout(() => this._open(), 1500);
            }
        };

        this.ws.onerror = () => {
            this.ws?.close();
        };
    }

    send(event) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(event));
        }
    }

    disconnect() {
        this.shouldConnect = false;
        clearTimeout(this.reconnectTimer);
        this.ws?.close();
        this.ws = null;
    }

    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const mouseWS = new MouseWebSocket();
