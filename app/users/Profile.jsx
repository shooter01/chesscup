import TimeAgo from 'javascript-time-ago'

// Load locale-specific relative date/time formatting rules.
import en from 'javascript-time-ago/locale/en'
import ru from 'javascript-time-ago/locale/ru'

// Add locale-specific relative date/time formatting rules.
TimeAgo.addLocale(en)
TimeAgo.addLocale(ru)

// cyka blyat
const timeAgo = new TimeAgo('ru-RU')

if (visited_at && visited_at != "null") {

    // "just now"
    var a = parseInt(visited_at);
    $(".text-light-gray").html(timeAgo.format(a));
}

