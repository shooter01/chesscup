function Timer(opts) {
    this.timeleft = parseInt(opts.timeleft)/1000;
    this.element = $(opts.element);

    if (this.timeleft > 0) {
        this.element.removeClass("hidden");
        this.words();
        this.setTimer();
        this.tick();
    } else {
        this.element.remove();
    }

}

Timer.prototype.setTimer = function () {
    var self = this;
    this.interval = setInterval(function () {
        self.timeleft = --self.timeleft;

        if (self.timeleft > 0) {
            self.tick();
        } else {
            self.timeleft = 0;
            clearInterval(self.interval);
        }
    }, 1000);
}


Timer.prototype.words = function () {
    this.wordsArr = {
        year: ["год", "года", "лет"],
        month: ["месяц", "месяца", "месяцев"],
        day: ["день", "дня", "дней"],
        hour: ["час", "часа", "часов"],
        minute: ["минута", "минуты", "минут"],
        second: ["секунда", "секунды", "секунд"]
    };
}
Timer.prototype.tick = function () {
    var secondsInAMinute = 60;
    var secondsInAnHour  = 60 * secondsInAMinute;
    var secondsInADay    = 24 * secondsInAnHour;

    // дни
    var days = Math.floor(this.timeleft / secondsInADay);

    // часы
    var hourSeconds = this.timeleft % secondsInADay;
    var hours = Math.floor(hourSeconds / secondsInAnHour);

    // минуты
    var minuteSeconds = hourSeconds % secondsInAnHour;
    var minutes = Math.floor(minuteSeconds / secondsInAMinute);

    // оставшиеся секунды
    var remainingSeconds = minuteSeconds % secondsInAMinute;
    var seconds = Math.ceil(remainingSeconds);

    var html = $("<span>Старт: 20.00 МСК. Осталось: </span>");

    if (days > 0) {
        var a = this.generateSpan("day", " ", days);
        html.append(this.generateSpan("day", " ", days));//this.generateSpan("day", " ", days);
    }
    if (hours > 0) {
        html.append(this.generateSpan("hour", " ", hours));
    }
    if (minutes > 0) {
        html.append(this.generateSpan("minute", " ", minutes));
    }

    html.append(this.generateSpan("second", " ", seconds));

    this.element.html(html);
};


Timer.prototype.generateSpan = function(limit, delimiter, value){
    var word = "";

    var orig_value = value;
    _value = value%10;

    if (_value == 1 && !(orig_value > 10 && orig_value < 15)) {
        word = this.wordsArr[limit][0];
    } else if (_value > 1 && _value < 5 && !(orig_value > 10 && orig_value < 15)) {
        word = this.wordsArr[limit][1];
    } else if (_value >= 5 || _value == 0 || (orig_value > 10 && orig_value < 15)) {
        word = this.wordsArr[limit][2];
    }

    return $("<span class='count_item_wrapper " + limit+ "_wrapper'><span class='count-i count_item year'>" + value +
        "</span> <span id='" + limit + "_delimiter' class='dec'> " + word + " </span></span>");
};


