/* ========================================================
   homepage.js —— 主页工具模块
   - 暴露 window.Homepage API
   - 角色选择页：角色卡片、详情、确认
   - 返回主页统一入口
   ======================================================== */

// ========== 主角页：角色选择 UI ==========
(function () {
  const HERO_PAGE_LS_KEY = 'hero_selected_id';

  function _getHero(id) {
    if (typeof HERO_POOL !== 'undefined' && HERO_POOL[id]) return HERO_POOL[id];
    return {
      id: id, name: '角色', avatar: '?', color: '#8a5cf0',
      desc: '数据加载中...',
      stats: { maxHp: 200, attackBonus: 0, attackRange: 250, attackSpeedBonus: 0, bulletSpeed: 400, critChance: 0 },
      primary: { type: 'single', name: '手枪', burstInterval: 0.8, damageMult: 1.0, range: 250, bulletSpeed: 400, bulletColor: '#f1c40f', bulletCore: '#ffffff' },
      activeSkill: null, passives: []
    };
  }

  function _applyAdventurePortrait(heroId) {
    const hero = _getHero(heroId);
    const frame = document.querySelector('#homepage-root .hp-portrait-frame');
    const img = document.querySelector('#homepage-root .hp-portrait-img');
    const placeholder = document.querySelector('#homepage-root .hp-portrait-placeholder');
    if (!frame || !img) return;
    let portraitPath;
    if (Array.isArray(hero.portrait) && hero.portrait.length > 0) {
      portraitPath = hero.portrait[0];
    } else if (typeof hero.portrait === 'string' && hero.portrait) {
      portraitPath = hero.portrait;
    } else {
      portraitPath = null;
    }
    if (portraitPath) {
      // 有立绘 → 显示图片，隐藏占位
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      img.style.opacity = '0';
      const nextPath = portraitPath;
      setTimeout(function () {
        img.src = nextPath;
        img.style.opacity = '1';
      }, 120);
      img.style.display = 'block';
      // 外框边框颜色同步角色主题色
      if (hero.color) frame.style.setProperty('--portrait-color', hero.color);
    } else {
      // 无立绘 → 显示占位
      img.style.display = 'none';
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
      frame.style.setProperty('--portrait-color', '#3498db');
    }
    if (window.LOG) window.LOG('homepage: 冒险页立绘已同步为角色=' + heroId + '（path=' + (portraitPath || '无') + '）');
  }

  function _renderHeroCards() {
    const cards = document.getElementById('hpHeroCards');
    if (!cards) return;
    if (typeof HERO_LIST === 'undefined' || HERO_LIST.length === 0) {
      cards.innerHTML = '<div style="color:rgba(255,255,255,0.5);padding:20px;">等待数据加载...</div>';
      return;
    }
    const selected = (function(){ try { return localStorage.getItem(HERO_PAGE_LS_KEY) || 'echo01'; } catch (e){ return 'echo01'; }})();
    cards.innerHTML = '';
    for (let h of HERO_LIST) {
      const el = document.createElement('div');
      el.className = 'hp-hero-card' + (h.id === selected ? ' active' : '');
      el.dataset.heroId = h.id;
      const skillName = (h.activeSkill && typeof ACTIVE_SKILL_POOL !== 'undefined' && ACTIVE_SKILL_POOL[h.activeSkill])
        ? ACTIVE_SKILL_POOL[h.activeSkill].name : '无';
      el.innerHTML =
        '<div class="hp-hero-card-avatar" style="color:' + h.color + ';border-color:' + h.color + ';">' + (h.avatar || h.name.charAt(0)) + '</div>' +
        '<div class="hp-hero-card-name">' + h.name + '</div>' +
        '<div class="hp-hero-card-skill">主动：' + skillName + '</div>' +
        '<div class="hp-hero-card-stats">' + (h.primary ? h.primary.name : '') + ' · HP ' + h.stats.maxHp + '</div>';
      el.addEventListener('click', function () { _selectHero(h.id); });
      cards.appendChild(el);
    }
    _renderHeroDetail(selected);
    _applyAdventurePortrait(selected);
  }

  function _selectHero(id) {
    if (typeof HERO_POOL !== 'undefined' && HERO_POOL && !HERO_POOL[id]) return;
    try { localStorage.setItem(HERO_PAGE_LS_KEY, id); } catch (e) {}
    const cards = document.getElementById('hpHeroCards');
    if (cards) {
      const items = cards.querySelectorAll('.hp-hero-card');
      items.forEach(function (el) {
        if (el.dataset.heroId === id) el.classList.add('active');
        else el.classList.remove('active');
      });
    }
    _renderHeroDetail(id);
    _applyAdventurePortrait(id);
    if (window.LOG) window.LOG('homepage: 已选中角色 = ' + id);
  }

  function _renderHeroDetail(id) {
    const detail = document.getElementById('hpHeroDetail');
    if (!detail) return;
    const h = _getHero(id);
    if (!h) { detail.innerHTML = ''; return; }
    const skill = (h.activeSkill && typeof ACTIVE_SKILL_POOL !== 'undefined') ? ACTIVE_SKILL_POOL[h.activeSkill] : null;
    const skillName = skill ? skill.name : '无';
    const skillDesc = skill ? skill.desc : '';
    const skillCd = skill ? skill.cooldown : 0;

    const passiveMap = {
      'tactical_charge': '战术充能：每完成一轮三连发累积 1 点能量，最多 3 层；下一轮首发 +80% 伤害',
      'field_reflex': '战场反应：生命值低于 30% 时，移动速度 +20%，攻击速度 +15%'
    };
    const passiveHtml = (h.passives && h.passives.length)
      ? '<div class="hp-hero-passive-card"><div class="hp-hero-passive-title">被动技能</div><div class="hp-hero-passive-desc">' +
          h.passives.map(function (p) { return passiveMap[p] || p; }).join('<br>') +
        '</div></div>'
      : '';

    const dpsInfo = h.primary
      ? (h.primary.type === 'triple'
          ? '三连发 ' + (1 / h.primary.burstInterval).toFixed(2) + ' 轮/s'
          : '单发 ' + (1 / h.primary.burstInterval).toFixed(2) + ' 发/s')
      : '';

    detail.innerHTML =
      '<div class="hp-hero-detail-row">' +
        '<div class="hp-hero-detail-portrait" style="color:' + h.color + ';border-color:' + h.color + ';">' + (h.avatar || h.name.charAt(0)) + '</div>' +
        '<div class="hp-hero-detail-info">' +
          '<div class="hp-hero-detail-name" style="color:' + h.color + ';">' + h.name + '</div>' +
          '<div class="hp-hero-detail-desc">' + h.desc + '</div>' +
          '<div class="hp-hero-stats-grid">' +
            '<div class="hp-hero-stat-item"><span class="hp-hero-stat-label">HP</span><span class="hp-hero-stat-value">' + h.stats.maxHp + '</span></div>' +
            '<div class="hp-hero-stat-item"><span class="hp-hero-stat-label">基础攻击</span><span class="hp-hero-stat-value">' + (5 + (h.stats.attackBonus || 0)) + '</span></div>' +
            '<div class="hp-hero-stat-item"><span class="hp-hero-stat-label">射程</span><span class="hp-hero-stat-value">' + h.stats.attackRange + '</span></div>' +
            '<div class="hp-hero-stat-item"><span class="hp-hero-stat-label">频率</span><span class="hp-hero-stat-value">' + dpsInfo + '</span></div>' +
            '<div class="hp-hero-stat-item"><span class="hp-hero-stat-label">弹速</span><span class="hp-hero-stat-value">' + (h.stats.bulletSpeed || 400) + '</span></div>' +
            '<div class="hp-hero-stat-item"><span class="hp-hero-stat-label">武器</span><span class="hp-hero-stat-value">' + (h.primary ? h.primary.name : '-') + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="hp-hero-skill-card">' +
        '<div class="hp-hero-skill-title">✦ ' + skillName +
          '<span class="hp-hero-skill-cd">冷却 ' + skillCd + 's</span>' +
        '</div>' +
        '<div class="hp-hero-skill-desc">' + (skillDesc || '—') + '</div>' +
      '</div>' +
      passiveHtml;
  }

  // 初始化（DOM 就绪后）
  function _init() {
    if (typeof HERO_POOL === 'undefined' || !HERO_POOL) {
      setTimeout(_init, 80);
      return;
    }
    _renderHeroCards();
    const btn = document.getElementById('hpHeroConfirmBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (window.LOG) window.LOG('homepage: hero 确认选择，切回冒险页');
        const btns = document.querySelectorAll('#homepage-root .hp-nav-btn');
        btns.forEach(function (b) {
          if (b.dataset.page === 'adventure') { b.click(); }
        });
      });
    }
  }

  // 暴露 HeroUI
  if (!window.HeroUI) window.HeroUI = {};
  window.HeroUI.init = _init;
  window.HeroUI.refresh = _renderHeroCards;
  window.HeroUI.selectHero = _selectHero;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    _init();
  } else {
    document.addEventListener('DOMContentLoaded', _init);
  }
})();

// ========== 主页工具（与 index.html 内联脚本协作） ==========
(function () {
  if (!window.Homepage) window.Homepage = {};
  if (window.LOG) window.LOG('homepage.js: 已加载 module');

  // 返回主页：由游戏暂停菜单或阵亡界面调用
  window.Homepage.goHome = function () {
    if (window.LOG) window.LOG('homepage: goHome() 被调用');
    if (window.GameCore && typeof window.GameCore.stopLoop === 'function') {
      window.GameCore.stopLoop();
    }
    const ids = ['devPanel', 'activeSkillIcon', 'pauseBtn', 'wheel', 'mapSelectMenu', 'mapSelectionModal'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    if (typeof window.Homepage.show === 'function') {
      window.Homepage.show();
      if (window.LOG) window.LOG('homepage: 已显示主页');
    } else {
      if (window.LOG_WARN) window.LOG_WARN('homepage: Homepage.show 不可用，回退 location.reload');
      location.reload();
    }
  };

  // 调试：在控制台输出主页状态
  window.Homepage.debug = function () {
    const hp = document.getElementById('homepage-root');
    const gr = document.getElementById('game-root');
    console.log('[Homepage] 主页可见:', hp && hp.style.display !== 'none');
    console.log('[Homepage] 游戏可见:', gr && gr.style.display !== 'none');
    console.log('[Homepage] GameCore 可用:', !!window.GameCore);
    console.log('[Homepage] GameUI 可用:', !!window.GameUI);
  };
})();
