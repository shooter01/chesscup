

$(function () {




        if (typeof Html5Upload != "undefined") {
            var fileuploader = new Html5Upload({
                input: "#exampleFormControlFile1",
                filenameAttr : "name",
                statusContainer: "#container",
                upload_url : "/leagues/upload",
                callbacks: {
                    before_send: function(xhr, fd, file){
                        fd.append("team_id", team_id);
                    },
                    complete: function (response, xhr, responseText) {
                        if (response.status == "ok") {
                            $("#image").attr("src", response.image);
                        } else {
                            alert("Error. Check the file.");
                        }
                        console.log(response);
                    }

                }});
            fileuploader.setHandler();
        }






        $("#edit_tournament").on("submit", function () {
            $(".errors").addClass("hidden").empty();

            $.post("/leagues/update", {
                team_id : team_id,
                name : $("#title").val(),
                description : $.trim($("#description").val()),
                country : $("#country").val(),
            }).done(function (data) {
                if (data.status != "ok") {
                    $(".errors").removeClass("hidden");
                    for (var obj in data.errors) {
                        $(".errors").append(data.errors[obj].msg);
                    }
                } else {
                    if (data.insertId) {
                        location.href = "/leagues/" + data.insertId;
                    }
                }
            }).fail(function (data, jqXHR, textStatus) {
                $(".errors").removeClass("hidden");
                if (data) {
                    for (var obj in data.responseJSON.errors) {
                        $(".errors").append(data.responseJSON.errors[obj].msg + "<br/>");

                    }
                } else {
                    alert("Ошибка сохранения");
                }
            });
            return false;
        });




    $("#add_season").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        $.post("/leagues/seasons/create"  , {
            league_id : league_id,
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
            data = JSON.parse(data.responseText);
            for (var obj in data.errors) {
                alert(data.errors[obj].msg);
            }
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });


    $("#update_description").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        console.log($("#season_description").val());
        console.log(season_id);
        $.post("/leagues/seasons/update"  , {
            season_id : season_id,
            description : $("#season_description").val(),
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
            data = JSON.parse(data.responseText);
            for (var obj in data.errors) {
                alert(data.errors[obj].msg);
            }
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });


    $("#end_season").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        $.post("/leagues/seasons/end"  , {
            season_id : season_id,
        }).done(function (data) {

            if (data.status != "ok") {
                for (var obj in data.errors) {
                    alert(data.errors[obj].msg);
                }
            } else {
                location.href = "/leagues/" + league_id;
            }

        }).fail(function (data, jqXHR, textStatus) {
            console.log("error");
            data = JSON.parse(data.responseText);
            for (var obj in data.errors) {
                alert(data.errors[obj].msg);
            }
        }).always(function () {
            button.removeAttr("disabled");
        });
        return false;
    });









})