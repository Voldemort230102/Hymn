// Monaco Editor 封装：初始化、多文件标签页、触摸配置
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';

// 配置 Monaco Worker（Vite 原生 ?worker 方式）
self.MonacoEnvironment = {
  getWorker(_workerId, _label) {
    return new EditorWorker();
  },
};

let editor = null;
const models = new Map(); // filename -> ITextModel
let activeFile = null;

// 扩展名 → Monaco 语言映射
const EXT_LANG = {
  py: 'python', js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
  html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
  json: 'json', md: 'markdown', markdown: 'markdown',
  xml: 'xml', svg: 'xml', yaml: 'yaml', yml: 'yaml',
  java: 'java', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp',
  cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby', php: 'php',
  sh: 'shell', bash: 'shell', sql: 'sql', lua: 'lua',
  r: 'r', swift: 'swift', kt: 'kotlin', scala: 'scala',
  vue: 'html', svelte: 'html',
};

export function getLanguageForFile(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return EXT_LANG[ext] || 'plaintext';
}

export function initEditor(container, options = {}) {
  editor = monaco.editor.create(container, {
    theme: 'dark-modern',
    language: 'python',
    fontSize: options.fontSize || 16,
    lineHeight: 24,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    matchBrackets: 'always',
    folding: true,
    wordWrap: 'off',
    // 触摸配置
    touchEventTarget: document.body,
    mouseWheelZoom: true,
    smoothScrolling: true,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      alwaysConsumeMouseWheel: false,
      useShadows: false,
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12,
    },
    // 自动补全
    quickSuggestions: { other: true, comments: false, strings: false },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabSize: 4,
    insertSpaces: true,
    // 可读性
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
  });

  // 内容变化时同步到文件系统（由外部注入 onChange 回调）
  editor.onDidChangeModelContent(() => {
    if (activeFile && options.onChange) {
      options.onChange(activeFile, editor.getValue());
    }
  });

  return editor;
}

export function getEditor() {
  return editor;
}

export function getMonaco() {
  return monaco;
}

// 打开文件：若已有 model 则切换，否则创建
export function openFile(filename, content) {
  let model = models.get(filename);
  if (!model) {
    model = monaco.editor.createModel(content, getLanguageForFile(filename));
    models.set(filename, model);
  } else {
    // 内容已由外部更新，这里若 model 内容与传入不同则更新
    if (model.getValue() !== content) {
      model.setValue(content);
    }
  }
  editor.setModel(model);
  activeFile = filename;
  // 聚焦以便弹出键盘
  editor.focus();
}

export function getActiveFile() {
  return activeFile;
}

export function getActiveContent() {
  return editor ? editor.getValue() : '';
}

// 重命名：model 关联文件名，语言随扩展名变化
export function renameFile(oldName, newName) {
  const model = models.get(oldName);
  if (model) {
    const content = model.getValue();
    model.dispose();
    models.delete(oldName);
    const newModel = monaco.editor.createModel(content, getLanguageForFile(newName));
    models.set(newName, newModel);
    if (activeFile === oldName) {
      activeFile = newName;
      editor.setModel(newModel);
    }
  }
}

export function closeFile(filename) {
  const model = models.get(filename);
  if (model) {
    model.dispose();
    models.delete(filename);
    if (activeFile === filename) {
      activeFile = null;
      editor.setModel(monaco.editor.createModel('', getLanguageForFile(filename)));
    }
  }
}

export function setFontSize(size) {
  if (editor) {
    editor.updateOptions({ fontSize: size });
  }
}

export function updateOptions(opts) {
  if (editor) editor.updateOptions(opts);
}

export function focus() {
  if (editor) editor.focus();
}
