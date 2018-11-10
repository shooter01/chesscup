
class Rooms{
    constructor(){
        this.rooms = {};
    }

    join (room, socket) {
        //добавляем в комнату
        if (typeof this.rooms[room] === "undefined") {
            this.rooms[room] = {};
            this.rooms[room][socket.id] = socket;
        } else {
            this.rooms[room][socket.id] = socket;
        }
    }

    disconnect (socket) {
        //удаляем из всех комнат

        for (let room in this.rooms) {
            for (let sock in this.rooms[room]) {
                if (socket.id == sock) {
                    delete this.rooms[room][sock];
                }
            }
        }

    }

    remove (room, socket) {
        //удаляем из конкретной комнаты
    }

    emitToUser (socket, data) {

    }

    emit (room, data) {
        //пересылка даты конкретной комнате

        if (typeof this.rooms[room] !== "undefined") {
            for (let obj in this.rooms[room]) {
                this.rooms[room][obj].send(data, {}, function (err) {
                    console.log(err);
                });
            }
        }

    }

}


module.exports = Rooms;