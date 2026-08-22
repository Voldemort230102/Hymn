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
