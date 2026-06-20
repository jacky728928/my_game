/* ===== 游戏主页交互（导航/立绘/与游戏的协调） ===== */
(function () {
  'use strict';

  // ===== 页面与状态 =====
  const PORTRAITS = [
    '初始角色.png',
    '同音不同字续写.png',
    '同音不同字续写 (1).png',
    '同音不同字续写 (2).png',
    '同音不同字续写 (3).png',
    '同音不同字续写 (4).png',
    '同音不同字续写 (6).png',
  ];
  let currentPortraitIndex = 0;
  let currentPage = 'adventure';

  // ===== DOM 元素 =====
  const pages = {
    hero: document.getElementById('page-hero'),
    tech: document.getElementById('page-tech'),
    adventure: document.getElementById('page-adventure'),
    shop: document.getElementById('page-shop'),
  };
  const navBtns = document.querySelectorAll('.nav-btn');
  const portraitImg = document.querySelector('.portrait-img');

  // ===== 初始化背景粒子 =====
  function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = 20;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 6 + 's';
      p.style.animationDuration = (4 + Math.random() * 4) + 's';
      const colors = ['#d4af37', '#00d4ff', '#ff2d75'];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(p);
    }
  }

  // ===== 切换立绘（带淡出淡入动画） =====
  function loadPortrait(index) {
    if (!portraitImg) return;
    const filename = PORTRAITS[index % PORTRAITS.length];
    const url = 'pic/' + encodeURI(filename);
    portraitImg.style.opacity = '0';
    setTimeout(function () {
      portraitImg.src = url;
      portraitImg.style.opacity = '1';
    }, 200);
  }
  function switchPortrait() {
    currentPortraitIndex = (currentPortraitIndex + 1) % PORTRAITS.length;
    loadPortrait(currentPortraitIndex);
  }

  // ===== 切换页面（更新 body[data-page] 驱动 CSS 显隐） =====
  function switchPage(pageName) {
    if (currentPage === pageName) return;

    // 视觉过渡
    const oldPage = pages[currentPage];
    const newPage = pages[pageName];

    if (oldPage) {
      oldPage.classList.add('page-exit');
      oldPage.classList.remove('active');
      setTimeout(function () { oldPage.classList.remove('page-exit'); }, 400);
    }
    if (newPage) newPage.classList.add('active');

    // 导航按钮激活状态
    navBtns.forEach(function (btn) {
      if (btn.dataset.page === pageName) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // 写入 body 属性：驱动游戏元素的显隐
    document.body.setAttribute('data-page', pageName);
    window._currentPage = pageName;

    currentPage = pageName;
  }

  // ===== 事件绑定 =====
  function bindNavEvents() {
    navBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = btn.dataset.page;
        if (target) switchPage(target);
      });
      btn.addEventListener('touchstart', function () {
        btn.style.transform = 'translateY(-2px) scale(0.98)';
      }, { passive: true });
      btn.addEventListener('touchend', function () {
        btn.style.transform = '';
      }, { passive: true });
    });

    const portraitSwitchBtn = document.getElementById('portraitSwitch');
    if (portraitSwitchBtn) portraitSwitchBtn.addEventListener('click', switchPortrait);
  }

  // ===== 初始化 =====
  function init() {
    initParticles();
    bindNavEvents();
    loadPortrait(0);
    // 默认显示冒险页（游戏主页面）
    switchPage('adventure');
  }

  // 对外暴露（便于调试/游戏逻辑协调）
  window.homeSwitchPage = switchPage;
  window.homeSwitchPortrait = switchPortrait;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
