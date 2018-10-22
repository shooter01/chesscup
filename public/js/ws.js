/**
 * библиотека для коннекта к вебсокетам, не зависит от наличия jQuery
 * пример:        new WS("channelName", handleData);
 * @type {{}}
 */

function WS(channelName, callback, serverHost) {
    var self = this;
    this.channelName = channelName;
    this.callback = callback || function () {};
    this.serverHost = serverHost || location.hostname;
    this.connect();
};

WS.sockets = {};

WS.prototype.connect = function () {
    var self = this;

    if (!window.WebSocket) {
        self.startSocketIO();
    } else {
        // создать подключение
        self.startNative();
    }
};

WS.prototype.startNative = function () {
    var self = this;
    this.ws = new WebSocket("ws://" + self.serverHost + "?channelName=" + self.channelName + "&type=pc");

    this.ws.onopen = function (event) {
        WS.sockets[self.channelName] = this;
    };

    // обработчик входящих сообщений
    this.ws.onmessage = function(result) {
        var data = JSON.parse(result.data);
        self.onMessage(self, data);
    };
    this.ws.onclose = function(isforced){
        //try to reconnect in 5 seconds
        self.stop();

        console.log("WS CLOSED. RECONNECT IN 5 SECS");
        setTimeout(function(){self.startNative()}, 5000);
    };
    this.ws.onerror = function(){
        console.error("Не могу подключиться к нативным вебсокетам");
    };
}

WS.prototype.startSocketIO = function () {
    var self = this;
    var script;
    if (!WS.socketIOadded) {
        WS.socketIOadded = "loading";

        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '/static/js/library/websockets/public/so.js';
        document.getElementsByTagName('head')[0].appendChild(script);

        script.onload = function () {
            connectSO();
        }
        script.onerror = function () {
            console.error("Не могу загрузить файл socket.io");
        }
    } else if (WS.socketIOadded == "loading") {
        setTimeout(function () {
            self.startSocketIO();
        }, 1000);
    } else {
        connectSO();
    }

    function connectSO() {
        WS.socketIOadded = "loaded";
        self.socket = io.connect('http://' + self.serverHost + ':8086?channelName=' + self.channelName);

        self.socket.on('connect', function (socket) {
            WS.sockets[self.channelName] = this;
        });

        self.socket.on('channeldata', function (event) {
            var data = JSON.parse(event.data);
            self.onMessage(self, data);
        });
    }
}

WS.prototype.onMessage = function (self, data) {
    self.callback(data.result);

    if (data.callback &&
        typeof window[data.callback] != "undefined" &&
        typeof window[data.callback] == "function") {
        window[data.callback](data.result);
    }
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
}

WS.prototype.stopAll = function () {
    for (var s in WS.sockets) {
        this.stop(WS.sockets[s]);
    }
    return true;
}

WS.prototype.showSonnections = function () {
    for (var s in WS.sockets) {
        console.log(s, WS.sockets[s]);
    }
    return true;
}