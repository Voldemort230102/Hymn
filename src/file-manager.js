// 文件管理：内存文件系统 + IndexedDB 持久化
const DB_NAME = 'primacy-ide';
const DB_VERSION = 1;
const STORE = 'files';

const files = new Map(); // filename -> content
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, { keyPath: 'name' });
      }
    };
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function init() {
  await openDB();
  await loadAll();
  // 默认文件
  if (files.size === 0) {
    files.set('main.py', `# Welcome to Primacy Pyodide IDE\nprint("Hello, Pyodide!")\n`);
    await saveAll();
  }
}

export async function loadAll() {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not open'));
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      files.clear();
      for (const row of req.result) {
        files.set(row.name, row.content);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAll() {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not open'));
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    for (const [name, content] of files) {
      store.put({ name, content });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function listFiles() {
  return Array.from(files.keys()).sort();
}

export function getFile(name) {
  return files.get(name);
}

export function createFile(name, content = '') {
  if (files.has(name)) return false;
  files.set(name, content);
  saveAll().catch(() => {});
  return true;
}

export function updateFile(name, content) {
  files.set(name, content);
}

export function deleteFile(name) {
  files.delete(name);
  saveAll().catch(() => {});
}

export function renameFile(oldName, newName) {
  if (!files.has(oldName) || files.has(newName)) return false;
  const content = files.get(oldName);
  files.delete(oldName);
  files.set(newName, content);
  saveAll().catch(() => {});
  return true;
}

export function downloadFile(name) {
  const content = files.get(name);
  if (content === undefined) return;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
