function createOvenPlayer(id, sources, mute) {
    var player = OvenPlayer.create(id, {
        "autoStart": true,
        "autoFallback": false,
        "mute": mute,
        "controls": true,
        "hlsConfig": {
            "liveSyncDuration": 0.5,
            "liveMaxLatencyDuration": 2,
            "maxLiveSyncPlaybackRate": 1.5
        },
        "sources": sources
    });
    player.on('stateChanged', (data) => {
        console.log("stateChanged");
        console.log(data);
        if (data.newstate === "error") {
            console.log("error");
            setTimeout(() => {
                console.log('starting player');
                player.stop();
                player.setCurrentSource(0);
                setTimeout(1000, () =>{
                    player.play();
                    console.log('started player');
                });
            }, 5000);
        }
    })
    return player;
}