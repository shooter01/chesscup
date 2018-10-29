
class WS {
    constructor(){
        console.log(g_ws_params);
        let ws_params = (typeof window.g_ws_params !== "undefined") ? window.g_ws_params : {};

        const str = this.getUrl(Object.assign(ws_params, {'h' : u}));

        window.socket = io(window.location.origin, {
            query:  str,
        });

        window.socket.on('eventClient', function (data) {
            if (data.event === "start_game") {
                if (typeof data.game_id != "undefined" && typeof data.tournament_id != "undefined"){

                    if (typeof g === "undefined") {
                        location.href = "/tournament/" + data.tournament_id + "/game/" + data.game_id;
                    } else {
                        if (!isNaN(parseInt(g)) && g != data.game_id) {
                            location.href = "/tournament/" + data.tournament_id + "/game/" + data.game_id;
                        }
                    }
                }
            }
        });

    }

    getUrl(ws_params){
        let str = "";
        for (let key in ws_params) {
            if (str != "") {
                str += "&";
            }
            str += key + "=" + encodeURIComponent(ws_params[key]);
        }
        return str;
    }
}

new WS();