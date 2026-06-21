// ========================================================================
// js/logger.js —— 统一后台日志系统
// ========================================================================
// 设计目标：
//   1. 所有关键事件（开始游戏、切换地图、WORLD_W 变化、墙体加载等）统一记录
//   2. 既输出到浏览器 Console，也保存到内存环形缓冲区（上限 MAX_LOGS）
//   3. 暴露 GameLogger 对象，可在开发者面板中查看 / 导出 / 清空
//   4. 暴露 window.LOG() / window.LOG_WARN() / window.LOG_ERROR() / window.LOG_DEBUG()
//      全局辅助函数，方便在任何脚本中直接调用
// ========================================================================

(function () {
  const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  const MAX_LOGS = 500;
  const logs = [];
  let enabled = true;
  let minLevel = LEVELS.DEBUG;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function timestamp() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
      + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
      + '.' + (d.getMilliseconds() < 10 ? '00' : d.getMilliseconds() < 100 ? '0' : '') + d.getMilliseconds();
  }

  function levelName(level) {
    for (const k in LEVELS) if (LEVELS[k] === level) return k;
    return 'INFO';
  }

  function add(level, args) {
    if (!enabled || level < minLevel) return;
    const parts = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (typeof a === 'object' && a !== null) {
        try {
          parts.push(JSON.stringify(a));
        } catch (e) {
          parts.push(String(a));
        }
      } else {
        parts.push(String(a));
      }
    }
    const message = parts.join(' ');
    const entry = {
      t: timestamp(),
      level: levelName(level),
      message: message,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();

    // 同步输出到浏览器 console
    const prefix = '[' + entry.t + '] [' + entry.level + ']';
    if (level === LEVELS.ERROR && console.error) {
      console.error(prefix, message);
    } else if (level === LEVELS.WARN && console.warn) {
      console.warn(prefix, message);
    } else if (level === LEVELS.DEBUG && console.debug) {
      console.debug(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  const GameLogger = {
    LEVELS: LEVELS,

    info: function () { add(LEVELS.INFO, arguments); },
    warn: function () { add(LEVELS.WARN, arguments); },
    error: function () { add(LEVELS.ERROR, arguments); },
    debug: function () { add(LEVELS.DEBUG, arguments); },

    // 查看/导出
    getAll: function () { return logs.slice(); },
    getRecent: function (n) { return logs.slice(-(n || 50)); },
    count: function () { return logs.length; },

    clear: function () {
      logs.length = 0;
      add(LEVELS.INFO, ['日志已清空']);
    },

    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; },

    setMinLevel: function (level) {
      if (typeof level === 'string' && LEVELS[level.toUpperCase()] !== undefined) {
        minLevel = LEVELS[level.toUpperCase()];
      } else if (typeof level === 'number' && level >= LEVELS.DEBUG && level <= LEVELS.ERROR) {
        minLevel = level;
      }
    },

    // 导出为文本（方便复制到本地保存）
    exportText: function () {
      const lines = [];
      for (let i = 0; i < logs.length; i++) {
        lines.push('[' + logs[i].t + '] [' + logs[i].level + '] ' + logs[i].message);
      }
      return lines.join('\n');
    },

    // 直接下载为 .log 文件（浏览器中使用）
    download: function (filename) {
      const text = GameLogger.exportText();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || ('game-log-' + new Date().toISOString().replace(/[:.]/g, '-') + '.log');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 100);
    },

    MAX: MAX_LOGS,
  };

  window.GameLogger = GameLogger;

  // 便捷全局函数 —— 任何脚本都可以直接调用
  window.LOG = function () { GameLogger.info.apply(null, arguments); };
  window.LOG_WARN = function () { GameLogger.warn.apply(null, arguments); };
  window.LOG_ERROR = function () { GameLogger.error.apply(null, arguments); };
  window.LOG_DEBUG = function () { GameLogger.debug.apply(null, arguments); };

  // 初始化日志
  GameLogger.info('=== 日志系统初始化 ===', '版本 v0.6.2', '最大条数 ' + MAX_LOGS);
})();
