function registerForBroadcastMapUpdates(callback) {
    const socket = io();
    socket.on('broadcastMap', (data) => {
        console.log('Received broadcast map update:', data);
        callback(data);
    });
}