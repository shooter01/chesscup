/**
 * библиотека для коннекта к вебсокетам, не зависит от наличия jQuery
 * пример:        new WS("channelName", handleData);
 * @type {{}}
 */

function WS(callback, serverHost) {
    var self = this;
    //this.channelName = channelName;
    this.callback = callback || function () {};
    this.serverHost = location.host;
    this.connect();
};

WS.sockets = {};

WS.prototype.connect = function () {
    var self = this;
        // создать подключение
    self.startNative();

};

WS.prototype.startNative = function () {
    var self = this;

    let ws_params = (typeof window.g_ws_params !== "undefined") ? window.g_ws_params : {};
    let defObject = (typeof window.u !== "undefined") ? {'h' : u} : {};

    const str = this.getUrl(Object.assign(ws_params, defObject));

    //говорим, что сокеты инциализированы
    window.socketInited = true;

    const protocol = (location.protocol === "https:") ? "wss://" : "ws://";

    this.ws = new WebSocket(protocol + self.serverHost + "/?" + str);

    this.ws.onopen = function (event) {
        if (self.interval) {
            clearInterval(self.interval);
        }
        self.interval = setInterval(function () {
            self.ws.send(JSON.stringify({"action" : "ping"}))
        }, 15000);
    };

    // обработчик входящих сообщений
    this.ws.onmessage = function(result) {
        var data = JSON.parse(result.data);

        if (data.action === "pong") {
            //проверяем что все ок
        } else if (data.action === "start_game") {
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
        } else {
            //если это не старт партии передаем дальше
            self.onMessage(data, self);
        }


    };
    this.ws.onclose = function(isforced){
        //try to reconnect in 5 seconds
        self.stop();

        console.log("WS CLOSED. RECONNECT IN 1 SECS");
        setTimeout(function(){self.startNative()}, 1000);
    };
    this.ws.onerror = function(){
        console.error("Не могу подключиться к нативным вебсокетам");
    };
}

WS.prototype.getUrl = function(ws_params){
    let str = "";
    for (let key in ws_params) {
        if (str != "") {
            str += "&";
        }
        str += key + "=" + encodeURIComponent(ws_params[key]);
    }
    return str;
}



WS.prototype.onMessage = function (data, self) {
    self.callback(data);
}


WS.prototype.stop = function (s) {
    var socket = s || this.socket || this.ws;
    if (this.socket) {
        socket.disconnect();
    } else {
        socket.close();
    }

    for (var s in WS.sockets) {
        if (WS.sockets[s] === socket){
            delete WS.sockets[s];
        }
    }
};

WS.prototype.stopAll = function () {
    for (var s in WS.sockets) {
        this.stop(WS.sockets[s]);
    }
    return true;
};

WS.prototype.showSonnections = function () {
    for (var s in WS.sockets) {
        console.log(s, WS.sockets[s]);
    }
    return true;
};

export default WS;