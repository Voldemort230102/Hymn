// 输出终端 + REPL
import * as pyodideManager from './pyodide-manager.js';

let bodyEl = null;
let replInput = null;
let replMultilineBuffer = '';
let replContinuation = false;

export function init(bodySelector, replInputSelector) {
  bodyEl = document.querySelector(bodySelector);
  replInput = document.querySelector(replInputSelector);

  pyodideManager.on('stdout', (text) => append(text, 'stdout'));
  pyodideManager.on('stderr', (text) => append(text, 'stderr'));

  replInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleReplEnter();
    }
  });
}

function append(text, type = 'stdout') {
  if (!bodyEl) return;
  // matplotlib 图像标记
  if (typeof text === 'string' && text.startsWith('__MATPLOTLIB__')) {
    const b64 = text.slice('__MATPLOTLIB__'.length);
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${b64}`;
    img.className = 'term-img';
    img.style.maxWidth = '100%';
    bodyEl.appendChild(img);
    bodyEl.appendChild(document.createElement('br'));
    scrollToBottom();
    return;
  }
  const span = document.createElement('span');
  span.className = `term-${type}`;
  // 保留空白与换行
  span.textContent = text;
  bodyEl.appendChild(span);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
  });
}

export function log(text, type = 'info') {
  append(text, type);
}

export function clear() {
  if (bodyEl) bodyEl.innerHTML = '';
}

export function focusRepl() {
  if (replInput) replInput.focus();
}

function isIncomplete(code) {
  // 简单检测未闭合括号 / 多行续行
  const open = (code.match(/[(\[{]/g) || []).length;
  const close = (code.match(/[)\]}]/g) || []).length;
  if (open > close) return true;
  const trimmed = code.trim();
  if (trimmed.endsWith('\\') || trimmed.endsWith(':')) return true;
  return false;
}

async function handleReplEnter() {
  const line = replInput.value;
  replInput.value = '';

  if (replContinuation) {
    replMultilineBuffer += '\n' + line;
  } else {
    replMultilineBuffer = line;
  }

  append((replContinuation ? '... ' : '>>> ') + line + '\n', 'input');

  if (isIncomplete(replMultilineBuffer)) {
    replContinuation = true;
    return;
  }

  replContinuation = false;
  const code = replMultilineBuffer;
  replMultilineBuffer = '';

  if (code.trim() === '') return;
  await pyodideManager.runRepl(code);
}
