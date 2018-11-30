/**
 * @version 1.0
 */

/**
 * задает основные переменные
 * @param opts
 * @constructor
 */

function Html5Upload(opts) {
    var defs = {
        input: null,
        post_params: {location: location.href},
        filenameAttr: null,
        eventType: "change",
        upload_url: "response.html",
        statusContainer: null,
        cancelAll: "#cancelAll",
        file_size_limit: 1000, //MB
        fadeOutTimeout: 3000, //milliseconds
        callbacks:{
            fileDialogStart: function () {},
            before_send: function (xhr, fd, file) {},
            before_upload: function (xhr, fd, file) {},
            progress: function (xhr, progressDiv, ev) {},
            success: function (response, xhr, responseText) {},
            error: function (response, xhr, responseText) {},
            complete: function (response, xhr, responseText) {},
            totalComplete: function () {},
        }
    };


    if (opts) {
        $.extend(true, defs, opts);
    }

    this.elems = $(defs.input);
    this.filenameAttr = this.elems.attr("name") || defs.input;
    this.eventType = defs.eventType;
    this.upload_url = defs.upload_url;
    this.fileList = [];
    this.statusContainer = defs.statusContainer;
    this.userCallbacks = defs.callbacks;
    this.cancelAll = $(defs.cancelAll);
    this.file_size_limit = defs.file_size_limit;
    this.post_params = defs.post_params;
    this.fadeOutTimeout = defs.fadeOutTimeout;

    if (!this.elems || this.elems.length == 0) {
        throw new Error("input не задан или не найден, проверьте параметры");
    }

}

/**
 * set handlers on elements
 */

Html5Upload.prototype.setHandler = function(){

    var mainObject = this;

    mainObject.elems.on(mainObject.eventType, function() {
        mainObject.uploadFile(this.files, arguments);
    });

    //if elements found, then return true, otherwise return false
    if ($(mainObject.cancelAll).length) {
        $(mainObject.cancelAll).on("click.cancelAll", function() {
            mainObject.abortAll();
            return false;
        });
        return true;
    } else {
        return false;
    }

}

/**
 * upload files one by one
 * @param args
 * @param files
 */
Html5Upload.prototype.uploadFile = function(files, args){
    for (var i in  files){
        if (typeof files[i] == "object") {
            files[i].divEl = new ProgressDiv({
                container: this.statusContainer,
                name: files[i].name,
                fadeOutTimeout:  this.fadeOutTimeout
            });
            files[i].divEl.append();
            this.fileList.push(files[i]);
        }
    }

    this.uploadFileOneByOne();
}

/**
 * if elements found then upoad them
 */
Html5Upload.prototype.uploadFileOneByOne = function(){
    if (this.fileList.length) {this.sendFile(this.fileList[0]);} else { this.elems.val("");}
}

/**
 * change progressbar width
 * @param xhr
 * @param progressDiv
 */
Html5Upload.prototype.setProgressBar = function(xhr, progressDiv){
    var mainObject = this;
    xhr.upload.addEventListener('progress',function(ev){
        //пользовательский коллбек
        progressDiv.setProgress(ev);
        //системный коллбек
        mainObject.userCallbacks.progress(xhr, progressDiv, ev);
    }, false);
}

/**
 * establish XHR connection
 * @param files
 * @returns {XMLHttpRequest}
 */

Html5Upload.prototype.createXHR = function(files){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", this.upload_url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Accept", "application/json");
    this.currentXHR = xhr;

    return xhr;
}

/**
 * check uploading filesize
 * if filesize exceeds restricts then return false
 * @param file
 * @returns {boolean}
 */
Html5Upload.prototype.checkFileSize = function(file){
    if (!file.size) {
        console.log("Не могу определить размеры файла", file);
    }
    return (file.size/1000000) < parseInt(this.file_size_limit);
}

/**
 * remove first element of array
 * means that file uploaded already and needless
 */
Html5Upload.prototype.unshiftFilesArray = function(){
    if (this.fileList.length) this.fileList.shift();
}

/**
 * abort all uploads
 */
Html5Upload.prototype.abortAll = function(){
    var mainObject = this;

    if (this.currentXHR) {
        this.currentXHR.abort();
    }

    for (var i = 0; i < this.fileList.length ; i++){
        if (typeof this.fileList[i] == "object") {
            this.fileList[i].divEl.setCancel("Отменено");
            this.fileList[i].divEl.hide();
        }
    }

    if (this.fileList.length) this.fileList = [];
}

/**
 * abort specific upload
 * @param progressDiv
 * @param xhr
 * @param text
 */

Html5Upload.prototype.abort = function(progressDiv, xhr, text){
    if (xhr) xhr.abort();
    progressDiv.setCancel(text);
    progressDiv.hide();
    this.unshiftFilesArray();
    this.uploadFileOneByOne();
}

/**
 * set params
 * @param fd
 */
Html5Upload.prototype.setPostParams = function(fd) {
    for (var i in this.post_params){
        fd.append( i, this.post_params[i]);
    }
}

/**
 * sendFile - Manager of uploading
 * @param file
 * @returns {boolean}
 */

Html5Upload.prototype.sendFile = function(file) {

    var mainObject = this;

    var progressDiv = file.divEl;

    //hte filesize is too large
    if (!this.checkFileSize(file)) {
        this.abort(progressDiv, xhr, "Слишком большой файл");
        return false;
    }

    var fd = new FormData();

    //establish xhr
    var xhr = this.createXHR();

    //ready to show progress
    this.setProgressBar(xhr, progressDiv);
    progressDiv.progress.find(".progressCancel").on("click", function() {
        mainObject.abort(progressDiv, xhr, "Отменено");
        return false;
    });

    //add file to sending data
    fd.append(this.filenameAttr, file);

    //add params to sending data
    this.setPostParams(fd);

    mainObject.userCallbacks.before_send(xhr, fd, file);

    xhr.send(fd);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 2) {
            mainObject.userCallbacks.before_upload(xhr, fd, file);
        }

        if (xhr.readyState == 4 && xhr.status == 200) {

            try {
                response = (typeof xhr.responseText == "string") ? JSON.parse(xhr.responseText) : xhr.responseText;

                if (response.status == 0) {
                    mainObject.unshiftFilesArray();
                    mainObject.uploadFileOneByOne();
                    progressDiv.setError(response, xhr, xhr.responseText);
                    progressDiv.hide();
                    //пользовательский коллбек
                    mainObject.userCallbacks.error(response, xhr, xhr.responseText);
                } else {
                    mainObject.unshiftFilesArray();
                    mainObject.uploadFileOneByOne();
                    progressDiv.setComplete(response, xhr, xhr.responseText);
                    progressDiv.hide();
                    mainObject.userCallbacks.success(response, xhr, xhr.responseText);
                }

                mainObject.userCallbacks.complete(response, xhr, xhr.responseText);

                //когда загрузка всех файлов завершена
                if (!mainObject.fileList.length) mainObject.userCallbacks.totalComplete();

            } catch(e) {
                console.log("Не могу распознать ответ: ", xhr.responseText);
                console.log(e.message);
            }
        }
        if (xhr.readyState == 4 && xhr.status != 200) {
            mainObject.userCallbacks.error(xhr, xhr.responseText);
        }
    };
}


/**
 * create div with progressbar
 * @param opts
 * @constructor
 */
function ProgressDiv(opts) {

    var defs = {
        container: null,
        name: null,
        fadeOutTimeout:  3000
    };

    if (opts) {
        $.extend(defs, opts);
    }

    this.progress = $('<div class="progressWrapper">' +
        '<div class="progressContainer">' +
        '<a class="progressCancel" href="#" ></a>' +
        '<div class="progressName">' + defs.name + '</div>' +
        '<div class="progressBarStatus">Ожидание...</div>' +
        '<div class="progressBarInProgress progress" style="width: 0%;" >' +
        '</div>' +
        '</div>' +
        '</div>');

    this.container = $(defs.container);
    this.fadeOutTimeout = defs.fadeOutTimeout;

    if (!defs.container || this.container.length == 0) {
        throw new Error("Контейнер не задан или не найден, проверьте параметры");
    }
}

/**
 * append progress div into container
 */
ProgressDiv.prototype.append = function() {
    this.container.append(this.progress);
}

/**
 * showing the progress
 * @param ev
 */
ProgressDiv.prototype.setProgress = function(ev) {
    this.progress.find(".progressBarStatus").html("Идет загрузка...");
    this.progress.find(".progressContainer").addClass("green");
    this.progress.find(".progressBarInProgress").css({"width": (ev.loaded/ev.total)*100+'%'});
}

/**
 * set the  completed state
 * @param ev
 */
ProgressDiv.prototype.setComplete = function(ev) {
    var text = (typeof ev.result === 'undefined') ? "Загружено" : ev.result;
    this.progress.find(".progressBarStatus").html(text);
    this.progress.find(".progressContainer").removeClass("green").addClass("blue");
}
/**
 * set Error state
 */
ProgressDiv.prototype.setError = function(text) {
    var textError = (typeof text.result === 'undefined') ? "Ошибка" : text.result;
    this.progress.find(".progressBarStatus").text(textError);
    this.progress.find(".progressContainer").removeClass("green").addClass("red");
    this.progress.find(".progressBarInProgress").removeClass("progressBarInProgress").addClass("progressBarComplete");
}

/**
 * setCancel state
 * @param text
 */
ProgressDiv.prototype.setCancel = function(text) {
    this.progress.find(".progressBarStatus").text(text);
    this.progress.find(".progressContainer").removeClass("green").addClass("red");
    this.progress.find(".progressBarInProgress").removeClass("progressBarInProgress").addClass("progressBarComplete");
}

/**
 * hide Progressdiv
 */
ProgressDiv.prototype.hide = function() {
    var self = this;
    this.progress.find(".progressBarInProgress").removeClass("progressBarInProgress").addClass("progressBarComplete");

    setTimeout(function() {
        self.progress.fadeOut(300, function() { $(this).remove(); });
    }, self.fadeOutTimeout);

}