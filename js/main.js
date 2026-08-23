// main.js
import * as page from "./switchPage.js";
import * as fileTree from "./fileTree.js";
import * as codeArea from "./codeArea.js";
import * as outputArea from "./outputArea.js";
import * as cloud from "./cloudDisk.js";

// 加载 Pyodide
let pyodide;
try {
    pyodide = await import("./loadPyodide.js");
} catch (e) {
    page.loadingPyodideError(e);
}
page.app();

// 新建按钮
$("#fileTreeTitleAdd").on("click", function() {
    fileTree.addOption();
});

// 新建文件夹
$("#addFolder").on("click", function() {
    let folderName = window.prompt("新建文件夹名称");
    let path;
    if (folderName) {
        pyodide.addFolder(folderName, path);
        fileTree.addFolder(folderName, path);
    } else {
        window.alert("文件夹名称不能为空！");
    }
});

// 新建文件
$("#addFile").on("click", function() {
    let fileName = window.prompt("新建文件名称");
    let path;
    if (fileName) {
        pyodide.addFile(fileName, path);
        fileTree.addFile(fileName, path);
    } else {
        window.alert("文件名称不能为空！");
    }
});

// 更多按钮
$("#fileTreeTitleMore").on("click", function() {
    fileTree.moreOption();
});

// 获取文件树
function getFileTree() {}

// 从 FS 加载文件
$("#loadFromFS").on("click", function() {
    if (window.confirm("是否从 IndeedDB 加载文件？")) {
        page.loadingFilesFS("请稍候……");
        try {
            pyodide.loadFromFS();
        } catch (e) {
            page.loadFromFSError(e);
        }
        fileTree.loadTree(getFileTree());
        page.app();
    } else {}
});

// 加载fileDict
function loadFileDict(fileDict, path) {}

// 从 云 加载
$("#loadFromCloud").on("click", function() {
    if (window.confirm("是否从 云 加载文件？")) {
        let projectName = window.prompt("请输入项目名称");
        page.loadingFromeCloud("获取文件列表中……");
        let fileDict;
        try {
            fileDict = cloud.getFileList(projectName);
        } catch (e) {
            page.loadFromCloudError("获取文件列表失败", e);
        }
        loadFileDict(fileDict);
        page.app();
    } else {}
});

// 上传全部
$("#uploadAll").on("click", function() {
    if (window.confirm("是否上传全部？")) {
        page.save2Cloud("生成文件列表中……");
        let tree = getFileTree();
        let fileDict;
        $.each(tree, function() {});
        let listMd5 = cloud.upload(fileDict);
        try {
            cloud.updateDisk(listMd5);
        } catch (e) {
            page.uploadAllError("更新项目md5失败", e);
        }
        page.app();
    } else {}
})

// 保存全部
$("#saveAll").on("click", function() {
    if (window.confirm("是否保存全部？")) {
        page.save2FS("请稍候……");
        try {
            pyodide.save2FS();
        } catch (e) {
            page.saveAllError(e);
        }
        page.app();
    } else {}
});

// 运行
$("#runThis").on("click", function() {
    let filePath = fileTree.now();
    pyodide.output2(outputArea.outputAreaMain);
    pyodide.run(filePath);
});

// 清空输出区
$("#clearOutput").on("click", function() {
    outputArea.clearOutput();
});

// 收起输出区
$("#closeOutput").on("click", function() {
    outputArea.closeOutput();
});
