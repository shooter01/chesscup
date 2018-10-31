var Chess = require('chess.js').Chess;

const is_draw = function (mongoGame, run_out_side) {

    //проверяем достаточно ли фигур у человека, который срубает флаг
    if (isDrawByInsufMaterial(mongoGame.fen, run_out_side)) {
        return true;
    } else {
        const chess = new Chess();
        chess.load(mongoGame.fen);
        return chess.in_draw();
    }
};


function isDrawByInsufMaterial(fen, run_out_side) {
    let is_draw = false;
    //у белых вышло время
    if (run_out_side === "white") {
        //ищем черные фигуры
        if (fen.search(/p|r|q|b|n/) === -1) {
            //если фигуры не обнаружены, это ничья
            is_draw = true;
        }

        //у черных вышло время
    } else if (run_out_side === "black") {
        if (fen.search(/P|R|Q|B|N/) === -1) {
            //если фигуры не обнаружены, это ничья
            is_draw = true;
        }
    }

    return is_draw;
}


module.exports = is_draw;