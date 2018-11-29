/**
 * Created by proger on 29.11.18.
 */



$(function () {
    $("#apply").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        $.post("/teams/apply"  , {
            team_id : team_id,
        }).done(function (data) {

            if (data.status != "ok") {
                for (var obj in data.errors) {
                    alert(data.errors[obj].msg);
                }
            } else {
                location.reload();
            }

        }).fail(function (data, jqXHR, textStatus) {
            console.log("error");
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });

    $("#dis_apply").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        $.post("/teams/dis_apply"  , {
            team_id : team_id,
        }).done(function (data) {

            if (data.status != "ok") {
                for (var obj in data.errors) {
                    alert(data.errors[obj].msg);
                }
            } else {
                location.reload();
            }

        }).fail(function (data, jqXHR, textStatus) {
            console.log("error");
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });

    $(".approve").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        var user_id = button.attr("data-id");
        $.post("/teams/approve"  , {
            team_id : team_id,
            user_id : user_id
        }).done(function (data) {

            if (data.status != "ok") {
                for (var obj in data.errors) {
                    alert(data.errors[obj].msg);
                }
            } else {
                $(button).closest("tr").remove();
            }

        }).fail(function (data, jqXHR, textStatus) {
            console.log("error");
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });

    $("#leave").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        var user_id = button.attr("data-id");
        $.post("/teams/leave"  , {
            team_id : team_id,
        }).done(function (data) {

            if (data.status != "ok") {
                for (var obj in data.errors) {
                    alert(data.errors[obj].msg);
                }
            } else {
                location.reload();
            }

        }).fail(function (data, jqXHR, textStatus) {
            console.log("error");
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });
})