// 包管理：micropip 安装 UI
import * as pyodideManager from './pyodide-manager.js';
import { log } from './terminal.js';

let modal = null;
let input = null;
let installBtn = null;

export function init(modalSelector, inputSelector, installBtnSelector, cancelBtnSelector) {
  modal = document.querySelector(modalSelector);
  input = document.querySelector(inputSelector);
  installBtn = document.querySelector(installBtnSelector);
  const cancelBtn = document.querySelector(cancelBtnSelector);

  installBtn.addEventListener('click', doInstall);
  cancelBtn.addEventListener('click', () => hide());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hide();
  });
}

export function show() {
  if (modal) modal.hidden = false;
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
}

function hide() {
  if (modal) modal.hidden = true;
}

async function doInstall() {
  const pkgs = input.value.trim();
  if (!pkgs) {
    log('请输入要安装的包名\n', 'stderr');
    return;
  }
  hide();
  log(`正在安装: ${pkgs}\n`, 'info');
  installBtn.disabled = true;
  try {
    const installed = await pyodideManager.installPackages(pkgs);
    log(`✓ 安装成功: ${installed.join(', ')}\n`, 'stdout');
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    log(`✗ 安装失败: ${msg}\n`, 'stderr');
  } finally {
    installBtn.disabled = false;
  }
}
