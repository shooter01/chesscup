
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
        console.log(Object.keys(this.rooms));
    }

    disconnect (socket) {
        //удаляем из всех комнат

        for (let room in this.rooms) {
            console.log(room);
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

    emit (room, data) {
        //пересылка даты конкретной комнате
        console.log("=====")

        console.log(Object.keys(this.rooms))
        if (typeof this.rooms[room] !== "undefined") {
            console.log(this.rooms[room]);
            for (let obj in this.rooms[room]) {
                console.log(this.rooms[room][obj]);

                this.rooms[room][obj].send(data, {}, function (err) {
                    console.log(err);
                });
            }
        }

    }

}


module.exports = Rooms;