

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

    $(".remove").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        var user_id = button.attr("data-id");
        $.post("/teams/remove_participant"  , {
            team_id : team_id,
            user_id : user_id,
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

    $(".assign_vice_captain").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        var user_id = button.attr("data-id");
        $.post("/teams/assign_vice_captain"  , {
            team_id : team_id,
            user_id : user_id,
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
    $(".assign_captain").on("click", function () {
        var button = $(this);
        button.attr("disabled", "disabled");
        var user_id = button.attr("data-id");
        if (confirm("Вы уверены ?")) {
            $.post("/teams/assign_captain"  , {
                team_id : team_id,
                user_id : user_id,
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
        }

        return false;
    });



        if (typeof Html5Upload != "undefined") {
            var fileuploader = new Html5Upload({
                input: "#exampleFormControlFile1",
                filenameAttr : "name",
                statusContainer: "#container",
                upload_url : "/teams/upload",
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

            $.post("/teams/update", {
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
                        location.href = "/teams/" + data.insertId;
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









})