// Pyodide 执行引擎：加载、运行、输入输出、中断、matplotlib
// loadPyodide 由 index.html 中的 <script src="./pyodide/pyodide.js"> 全局注入
const loadPyodide = globalThis.loadPyodide;

let pyodide = null;
let globals = null; // 持久命名空间，供 REPL 复用
let interruptBuffer = null;
let running = false;

const listeners = {
  stdout: [],
  stderr: [],
  status: [],
};

function emit(type, data) {
  (listeners[type] || []).forEach((fn) => fn(data));
}

export function on(event, fn) {
  if (listeners[event]) listeners[event].push(fn);
}

function stdin() {
  // 同步阻塞输入，Pad 上弹系统输入框
  const val = window.prompt('Python input()');
  return val === null ? '' : val + '\n';
}

function handleStdout(text) {
  emit('stdout', text);
}

function handleStderr(text) {
  emit('stderr', text);
}

export async function load(indexURL = './pyodide/') {
  emit('status', 'loading');
  try {
    pyodide = await loadPyodide({
      indexURL,
      stdout: handleStdout,
      stderr: handleStderr,
      stdin,
    });
    // 持久命名空间
    globals = pyodide.globals.get('dict')();
    // 中断缓冲区：优先 SharedArrayBuffer（需 COOP/COEP），否则降级普通 Int32Array
    if (typeof SharedArrayBuffer !== 'undefined') {
      interruptBuffer = new Int32Array(new SharedArrayBuffer(4));
    } else {
      interruptBuffer = new Int32Array(4);
    }
    try {
      pyodide.setInterruptBuffer(interruptBuffer);
    } catch (e) {
      // 普通 Int32Array 无法用于中断，忽略
    }
    // 预加载常用科学计算包（离线已下载到本地）
    try {
      emit('stdout', '正在加载常用包（numpy / matplotlib / pandas）…\n');
      await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas']);
      emit('stdout', '常用包加载完成。\n');
    } catch (e) {
      emit('stderr', `常用包加载失败（可在包管理中手动安装）: ${e && e.message ? e.message : e}\n`);
    }
    emit('status', 'ready');
    return pyodide;
  } catch (err) {
    emit('status', 'error');
    emit('stderr', `Pyodide 加载失败: ${err && err.message ? err.message : err}\n`);
    if (err && err.stack) emit('stderr', `堆栈: ${err.stack}\n`);
    console.error('[Pyodide load error]', err);
  }
}

export function isReady() {
  return !!pyodide;
}

export function isRunning() {
  return running;
}

// 运行整段代码（用于「运行」按钮）
export async function runCode(code) {
  if (!pyodide) {
    emit('stderr', 'Pyodide 尚未加载完成\n');
    return;
  }
  running = true;
  emit('status', 'running');
  try {
    // 尝试配置 matplotlib（若未安装则跳过）
    try {
      await pyodide.runPythonAsync(
        `import sys, io\nimport matplotlib\nmatplotlib.use('AGG')\nimport matplotlib.pyplot as plt\n`,
        { globals }
      );
    } catch (e) {
      // matplotlib 不可用，忽略
    }
    await pyodide.runPythonAsync(code, { globals });
    // 尝试捕获 matplotlib 图像
    try {
      const figCount = pyodide.runPython('plt.get_fignums()', { globals });
      if (figCount && figCount.length > 0) {
        const buf = pyodide.runPython(
          `import base64\n_buf = io.BytesIO()\nplt.savefig(_buf, format='png', bbox_inches='tight')\nplt.close('all')\nbase64.b64encode(_buf.getvalue()).decode('ascii')\n`,
          { globals }
        );
        if (buf) emit('stdout', `__MATPLOTLIB__${buf}`);
      }
    } catch (e) {
      // 忽略 matplotlib 捕获错误
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    emit('stderr', msg + '\n');
  } finally {
    running = false;
    emit('status', 'ready');
  }
}

// REPL 单行执行
export async function runRepl(line) {
  if (!pyodide) return;
  running = true;
  emit('status', 'running');
  try {
    const result = await pyodide.runPythonAsync(line, { globals });
    if (result !== undefined && result !== null) {
      // 非 None 的表达式结果显示
      let repr;
      try {
        repr = await pyodide.runPythonAsync(`repr((${line}))`, { globals });
      } catch {
        repr = String(result);
      }
      if (repr && repr !== 'None') emit('stdout', repr + '\n');
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    emit('stderr', msg + '\n');
  } finally {
    running = false;
    emit('status', 'ready');
  }
}

// 中断运行
export function interrupt() {
  if (interruptBuffer && pyodide) {
    if (typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined') {
      Atomics.store(interruptBuffer, 0, 1);
      emit('stderr', '已发送中断信号\n');
    } else {
      emit('stderr', '当前环境不支持中断（SharedArrayBuffer 不可用），请刷新页面重启 Pyodide。\n');
    }
  }
}

// 包管理：安装包
export async function installPackages(pkgs) {
  if (!pyodide) throw new Error('Pyodide 未加载');
  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');
  const list = pkgs.split(',').map((s) => s.trim()).filter(Boolean);
  await micropip.install(list);
  return list;
}

export function getPyodide() {
  return pyodide;
}
