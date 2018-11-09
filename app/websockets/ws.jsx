import WS from "../ws";

class Web {
    constructor(){
        //console.log(window.g_ws_params);
        let ws_params = (typeof window.g_ws_params !== "undefined") ? window.g_ws_params : {};
        let defObject = (typeof window.u !== "undefined") ? {'h' : u} : {};

        const str = this.getUrl(Object.assign(ws_params, defObject));


        /*window.socket = new WS("test23", handleData, "localhost:7000");


        function handleData(data) {
            console.log(arguments);
            console.log(data);
        }*/

        /*window.socket = io(window.location.origin, {
            query:  str,
        });*/

        /*window.socket.on('eventClient', function (data) {
            if (data.event === "start_game") {
                //console.log(data);
                if (typeof data.game_id != "undefined" && data.tournament_id){

                    if (typeof g === "undefined") {
                        location.href = "/tournament/" + data.tournament_id + "/game/" + data.game_id;
                    } else {
                        if (!isNaN(parseInt(g)) && g != data.game_id) {
                            location.href = "/tournament/" + data.tournament_id + "/game/" + data.game_id;
                        }
                    }
                } else if (typeof data.game_id != "undefined" && !data.tournament_id){
                    if (typeof g === "undefined") {
                        location.href = "/play/game/" + data.game_id;
                    } else {
                        if (!isNaN(parseInt(g)) && g != data.game_id) {
                            location.href = "/play/game/" + data.game_id;
                        }
                    }
                }

            }
        });*/

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


$(function () {
    new Web();
});

