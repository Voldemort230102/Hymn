// 触摸交互：长按菜单、虚拟键盘管理
export function initLongPress(listEl, onMenu) {
  let pressTimer = null;
  let currentTarget = null;

  function clearTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  listEl.addEventListener('touchstart', (e) => {
    const item = e.target.closest('.file-item');
    if (!item) return;
    currentTarget = item;
    pressTimer = setTimeout(() => {
      onMenu(item, e.touches[0].clientX, e.touches[0].clientY);
      currentTarget = null;
    }, 500);
  }, { passive: true });

  listEl.addEventListener('touchmove', clearTimer, { passive: true });
  listEl.addEventListener('touchend', clearTimer);
  listEl.addEventListener('touchcancel', clearTimer);

  // 鼠标右键也支持
  listEl.addEventListener('contextmenu', (e) => {
    const item = e.target.closest('.file-item');
    if (!item) return;
    e.preventDefault();
    onMenu(item, e.clientX, e.clientY);
  });
}

export function initVirtualKeyboard() {
  const vk = navigator.virtualKeyboard;
  if (!vk) return;
  try {
    vk.overlaysContent = true;
  } catch (e) {
    // 忽略
  }
  vk.addEventListener('geometrychange', () => {
    const h = vk.boundingRect.height;
    if (h > 0) {
      document.body.classList.add('vk-open');
    } else {
      document.body.classList.remove('vk-open');
    }
  });
}
