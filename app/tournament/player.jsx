class PlayerSockets {
    constructor(){
        var url;
        if (typeof u != "undefined") {
            url = 'h=' + u;
        } else {
            url = 'h=null';
        }
        console.log(u);
        this.socket = io(window.location.origin, {query: url});

        this.socket.on('game_start', function (data) {
            console.log(data);
            data = JSON.parse(data);

            if (typeof data.game_id != "undefined" && typeof data.tournament_id != "undefined"){
                location.href = "/tournament/" + data.tournament_id + "/game/" + data.game_id;
            } else {
                console.log("нет id турнира или id игры");
            }

        });

    }
}

new PlayerSockets();

