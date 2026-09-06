// 应用入口：串联所有模块
import * as monaco from 'monaco-editor';
import { defineDarkModernTheme } from './theme.js';
import * as fileManager from './file-manager.js';
import * as terminal from './terminal.js';
import * as pyodideManager from './pyodide-manager.js';
import * as ui from './ui.js';

async function main() {
  // 1. 定义主题
  defineDarkModernTheme(monaco);
  monaco.editor.setTheme('dark-modern');

  // 2. 初始化终端
  terminal.init('#terminal-body', '#repl-input');

  // 3. 加载文件系统
  try {
    await fileManager.init();
  } catch (err) {
    terminal.log(`文件系统初始化失败: ${err.message}\n`, 'stderr');
  }

  // 4. 绑定 UI（含编辑器初始化）
  ui.bind();

  // 5. 加载 Pyodide
  terminal.log('正在加载 Pyodide 运行时…\n', 'info');
  try {
    await pyodideManager.load('./pyodide/');
    terminal.log('Pyodide 加载完成，可以运行 Python 代码了。\n', 'info');
  } catch (err) {
    terminal.log(`Pyodide 加载失败: ${err.message}\n`, 'stderr');
  }
}

main();
