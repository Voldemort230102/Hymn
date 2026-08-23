// switchPage.js
function show(id) {
    let all = [
        "#loadingPyodide",
        "#app",
        "#loadingFiles",
        "#showError"
    ];
    $.each(all, function () {
        if (this == id) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

function showError(title, content, err=null) {
    $("#showErrorTitle").text(title);
    $("#showErrorContent").text(content.toString());
    show("#showError");
    if (err == null) {
        throw content;
    } else {
        throw err;
    }
}

export function loadingPyodideError(content) {
    showError("加载 Pyodide 时出错", content);
}

export function loadFromFSError(content) {
    showError("从 IndexedDB 加载文件时出错", content);
}

export function loadFromCloudError(content, err) {
    showError("从 云 加载文件时出错", content, err);
}

export function uploadAllError(content) {
    showError("上传至 云 时出错", content);
}

export function saveAllError(content) {
    showError("保存至 IndeedDB 时出错", content);
}

export function runThisError(content) {
    showError("运行时出错", content);
}

export function app() {
    show("#app");
}

function showLoadingFiles(title, content) {
    $("#loadingFilesTitle").text(title);
    $("#loadingFilesProgress").text(content);
    show("#loadingFiles");
}

export function loadingFilesFS(content) {
    showLoadingFiles("从 IndeedDB 加载中……", content);
}

export function loadingFromeCloud(content) {
    showLoadingFiles("从 云 加载中……", content);
}