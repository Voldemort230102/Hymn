import {loadPyodide} from "../pyodide/pyodide.mjs";

const pyodide = await loadPyodide();

// 暴露给全局（以便按钮的 onclick 能调用）
window.pyodide = pyodide;

// 定义全局运行函数
window.runCode = function() {
    try {
        const result = pyodide.runPython(`
            import sys
            f"Hello from Python {sys.version}"
        `);
        console.log(result);
    } catch (err) {
        console.error(err);
    }
};

// 自动执行一次
window.runCode();
