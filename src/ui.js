// UI 控制：工具栏、侧边栏、终端、设置、上下文菜单
import * as editor from './editor.js';
import * as fileManager from './file-manager.js';
import * as terminal from './terminal.js';
import * as pyodideManager from './pyodide-manager.js';
import * as packageManager from './package-manager.js';
import { initLongPress, initVirtualKeyboard } from './touch-handler.js';

let activeFile = 'main.py';
let autoSave = true;
let contextTargetFile = null;

export function bind() {
  // 工具栏
  document.getElementById('btn-run').addEventListener('click', runCode);
  document.getElementById('btn-stop').addEventListener('click', stopCode);
  document.getElementById('btn-toggle-sidebar').addEventListener('click', toggleSidebar);
  document.getElementById('btn-new').addEventListener('click', newFile);
  document.getElementById('btn-save').addEventListener('click', saveCurrent);
  document.getElementById('btn-packages').addEventListener('click', () => packageManager.show());
  document.getElementById('btn-settings').addEventListener('click', () => toggleModal('modal-settings'));

  // 侧边栏新建
  document.getElementById('btn-new-file').addEventListener('click', newFile);

  // 终端
  document.getElementById('btn-clear-terminal').addEventListener('click', () => terminal.clear());
  document.getElementById('btn-toggle-terminal').addEventListener('click', toggleTerminal);

  // 设置
  const fontSize = document.getElementById('font-size');
  const fontSizeVal = document.getElementById('font-size-val');
  fontSize.addEventListener('input', () => {
    const size = parseInt(fontSize.value, 10);
    fontSizeVal.textContent = size + 'px';
    editor.setFontSize(size);
  });
  document.getElementById('auto-save').addEventListener('change', (e) => {
    autoSave = e.target.checked;
  });
  document.getElementById('settings-close').addEventListener('click', () => toggleModal('modal-settings'));

  // 状态栏
  pyodideManager.on('status', (s) => {
    const el = document.getElementById('pyodide-status');
    const runBtn = document.getElementById('btn-run');
    const stopBtn = document.getElementById('btn-stop');
    if (s === 'loading') el.textContent = 'Pyodide 加载中…';
    else if (s === 'ready') el.textContent = 'Pyodide 就绪';
    else if (s === 'running') { el.textContent = '运行中…'; runBtn.disabled = true; stopBtn.disabled = false; }
    else if (s === 'error') el.textContent = 'Pyodide 错误';
    if (s !== 'running') { runBtn.disabled = false; stopBtn.disabled = true; }
  });

  // 包管理
  packageManager.init('#modal-packages', '#pkg-input', '#pkg-install', '#pkg-cancel');

  // 长按菜单
  const fileList = document.getElementById('file-list');
  initLongPress(fileList, showContextMenu);
  initContextMenuActions();

  // 虚拟键盘
  initVirtualKeyboard();

  // 编辑器内容变化 → 文件系统同步
  editor.initEditor(document.getElementById('editor-container'), {
    onChange: (name, content) => {
      fileManager.updateFile(name, content);
      if (autoSave) fileManager.saveAll();
      updateTabDirty(name);
    },
  });

  renderFileList();
  openFile(activeFile);
}

function renderFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = '';
  for (const name of fileManager.listFiles()) {
    const item = document.createElement('div');
    item.className = 'file-item' + (name === activeFile ? ' active' : '');
    item.dataset.name = name;
    item.innerHTML = `<svg class="file-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg><span class="file-name">${name}</span>`;
    item.addEventListener('click', () => {
      saveCurrentSilent();
      openFile(name);
    });
    list.appendChild(item);
  }
  renderTabs();
}

function renderTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  for (const name of fileManager.listFiles()) {
    const tab = document.createElement('div');
    tab.className = 'tab' + (name === activeFile ? ' active' : '');
    tab.innerHTML = `<span class="tab-name">${name}</span><span class="tab-close" title="关闭">✕</span>`;
    tab.querySelector('.tab-name').addEventListener('click', () => {
      saveCurrentSilent();
      openFile(name);
    });
    tab.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(name);
    });
    tabs.appendChild(tab);
  }
}

function openFile(name) {
  if (fileManager.getFile(name) === undefined) return;
  activeFile = name;
  editor.openFile(name, fileManager.getFile(name));
  document.getElementById('active-file-name').textContent = name;
  renderFileList();
}

function closeTab(name) {
  if (fileManager.listFiles().length <= 1) {
    terminal.log('至少保留一个文件\n', 'stderr');
    return;
  }
  fileManager.deleteFile(name);
  editor.closeFile(name);
  const remaining = fileManager.listFiles();
  if (remaining.length) {
    openFile(remaining[0]);
  } else {
    activeFile = null;
    renderFileList();
  }
}

function updateTabDirty() {
  // 简化：不实现脏标记
}

function saveCurrentSilent() {
  const name = editor.getActiveFile();
  if (name) {
    fileManager.updateFile(name, editor.getActiveContent());
    fileManager.saveAll().catch(() => {});
  }
}

function saveCurrent() {
  saveCurrentSilent();
  terminal.log(`已保存: ${activeFile}\n`, 'info');
}

async function runCode() {
  if (!pyodideManager.isReady()) {
    terminal.log('Pyodide 尚未加载完成，请稍候…\n', 'stderr');
    return;
  }
  if (!activeFile || !activeFile.toLowerCase().endsWith('.py')) {
    terminal.log('仅支持运行 .py 文件，请切换到 Python 文件后再运行。\n', 'stderr');
    return;
  }
  saveCurrentSilent();
  const code = editor.getActiveContent();
  terminal.log(`\n--- 运行 ${activeFile} ---\n`, 'info');
  await pyodideManager.runCode(code);
}

function stopCode() {
  pyodideManager.interrupt();
  terminal.log('已发送中断信号\n', 'stderr');
}

function newFile() {
  const name = window.prompt('输入新文件名（例如 script.py、notes.md、data.json）', 'untitled.py');
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed || trimmed === '.' || trimmed.startsWith('.')) {
    terminal.log('请输入有效的文件名\n', 'stderr');
    return;
  }
  if (!fileManager.createFile(trimmed, '')) {
    terminal.log('文件已存在\n', 'stderr');
    return;
  }
  saveCurrentSilent();
  openFile(trimmed);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleTerminal() {
  const panel = document.getElementById('terminal-panel');
  const btn = document.getElementById('btn-toggle-terminal');
  panel.classList.toggle('collapsed');
  const collapsed = panel.classList.contains('collapsed');
  btn.textContent = collapsed ? '▲' : '—';
  btn.title = collapsed ? '展开终端' : '折叠终端';
}

function toggleModal(id) {
  const m = document.getElementById(id);
  m.hidden = !m.hidden;
}

// ===== 上下文菜单 =====
function showContextMenu(item, x, y) {
  contextTargetFile = item.dataset.name;
  const menu = document.getElementById('context-menu');
  menu.hidden = false;
  // 防止溢出屏幕
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 8;
  const maxY = window.innerHeight - rect.height - 8;
  menu.style.left = Math.min(x, maxX) + 'px';
  menu.style.top = Math.min(y, maxY) + 'px';
}

function hideContextMenu() {
  document.getElementById('context-menu').hidden = true;
  contextTargetFile = null;
}

function initContextMenuActions() {
  const menu = document.getElementById('context-menu');
  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !contextTargetFile) return;
    const action = btn.dataset.action;
    const name = contextTargetFile;
    hideContextMenu();
    if (action === 'rename') {
      const newName = window.prompt('重命名为', name);
      if (newName && newName !== name) {
        if (fileManager.renameFile(name, newName)) {
          editor.renameFile(name, newName);
          if (activeFile === name) activeFile = newName;
          renderFileList();
        } else {
          terminal.log('重命名失败（名称冲突）\n', 'stderr');
        }
      }
    } else if (action === 'delete') {
      if (fileManager.listFiles().length <= 1) {
        terminal.log('至少保留一个文件\n', 'stderr');
        return;
      }
      if (window.confirm(`确定删除 ${name} ?`)) {
        fileManager.deleteFile(name);
        editor.closeFile(name);
        if (activeFile === name) {
          const remaining = fileManager.listFiles();
          activeFile = remaining[0] || null;
          if (activeFile) editor.openFile(activeFile, fileManager.getFile(activeFile));
        }
        renderFileList();
      }
    } else if (action === 'download') {
      fileManager.downloadFile(name);
    }
  });

  // 点击其他区域关闭菜单
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !e.target.closest('.file-item')) hideContextMenu();
  });
}
