
class Rooms {
    constructor() {
        this.rooms = {};
    }

    join(room, socket) {
        //добавляем в комнату
        if (typeof this.rooms[room] === "undefined") {
            this.rooms[room] = {};
        } else {
            this.rooms[room][socket.id] = socket;
        }
        this.rooms[room][socket.id] = socket;

      //  console.log("комната : " + room + " Количество пользователей в ней : " + Object.keys(this.rooms[room]).length);


    }

    disconnect(socket) {
        //удаляем из всех комнат

        for (let room in this.rooms) {
            for (let sock in this.rooms[room]) {
                if (socket.id == sock) {
                    console.log("Удален пользователь : " + sock + " из комнаты " + room);
                    delete this.rooms[room][sock];
                }
                if (Object.keys(this.rooms[room]).length === 0) {
                    delete this.rooms[room];
                }
            }
        }
        //console.log(Object.keys(this.rooms));
    }

    remove(room, socket) {
        //удаляем из конкретной комнаты
    }

    emitToUser(socket, data) {

    }

    emit(room, data) {
        try {
            // console.log(room);
          //  console.log("пересылка даты конкретной комнате");
          //  console.log(data);
         //   console.log("пересылка даты конкретной комнате");
            //пересылка даты конкретной комнате
            //console.log(Object.keys(this.rooms));
            if (typeof this.rooms[room] !== "undefined") {
                //console.log(room);
                for (let obj in this.rooms[room]) {
                   // console.log("id получателя");
                   // console.log(this.rooms[room][obj].id);
                  //  console.log("//id получателя");

                  //  console.log("комната : " + room + " Количество пользователей в ней : " + Object.keys(this.rooms[room]).length);


                    this.rooms[room][obj].send(data, {}, function (err) {
                        console.log(err);
                    });
                }
            }

        }
        catch(e) {
            console.log(e.message);
        }
    }
}


module.exports = Rooms;