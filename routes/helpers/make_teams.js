const makeTeams = function (teams_participants, teams) {
    console.log(teams);
    for (var i = 0; i < teams_participants.length; i++) {

        var obj = teams_participants[i];

       // teams[obj.team_id] = teams[obj.team_id] || {};
       // teams[obj.team_id].team_id = obj.team_id;
        teams[obj.team_id].users = teams[obj.team_id].users || [];

        var user = {
            user_id: obj.user_id,
            name: obj.name,
            email: obj.email,
            team_board: obj.team_board,
        };

        if (user.user_id) {
            teams[obj.team_id].users.push(user);
            teams[obj.team_id].users.sort(compare);

        }
    }
    return teams;
}


function compare(a, b) {
        if (a.team_board < b.team_board)
            return -1;
        if (a.team_board > b.team_board)
            return 1;
        return 1;


}

module.exports = makeTeams;