/**
 * 游戏主页交互逻辑
 * 独立于游戏本体运行
 */

(function() {
  'use strict';

  // 当前页面状态
  let currentPage = 'adventure';

  // 立绘列表（按 pic 目录里的文件名）
  const portraits = [
    '初始角色.png',
    '同音不同字续写.png',
    '同音不同字续写 (1).png',
    '同音不同字续写 (2).png',
    '同音不同字续写 (3).png',
    '同音不同字续写 (4).png',
    '同音不同字续写 (6).png'
  ];
  let currentPortraitIndex = 0;

  // DOM 元素缓存
  const pages = {
    hero: document.getElementById('page-hero'),
    tech: document.getElementById('page-tech'),
    adventure: document.getElementById('page-adventure'),
    shop: document.getElementById('page-shop')
  };

  const navBtns = document.querySelectorAll('.nav-btn');

  /**
   * 初始化背景粒子
   */
  function initParticles() {
    const container = document.getElementById('particles');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 6 + 's';
      particle.style.animationDuration = (4 + Math.random() * 4) + 's';
      
      // 随机颜色
      const colors = ['#d4af37', '#00d4ff', '#ff2d75'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      
      container.appendChild(particle);
    }
  }

  /**
   * 切换页面
   * @param {string} pageName - 目标页面名称
   */
  function switchPage(pageName) {
    if (currentPage === pageName) return;

    const oldPage = pages[currentPage];
    const newPage = pages[pageName];

    // 添加退出动画
    oldPage.classList.add('page-exit');
    oldPage.classList.remove('active');

    // 短暂延迟后切换新页面
    setTimeout(() => {
      oldPage.classList.remove('page-exit');
      newPage.classList.add('active');
    }, 150);

    // 更新导航按钮状态
    navBtns.forEach(btn => {
      if (btn.dataset.page === pageName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    currentPage = pageName;
  }

  /**
   * 绑定导航按钮点击事件
   */
  function bindNavEvents() {
    navBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const targetPage = this.dataset.page;
        switchPage(targetPage);
      });

      // 触摸设备优化
      btn.addEventListener('touchstart', function() {
        this.style.transform = 'translateY(-2px) scale(0.98)';
      }, { passive: true });

      btn.addEventListener('touchend', function() {
        this.style.transform = '';
      }, { passive: true });
    });
  }

  /**
   * 加载立绘（带淡入淡出动画）
   */
  function loadPortrait(index) {
    const img = document.querySelector('.portrait-img');
    if (!img) return;

    const filename = portraits[index % portraits.length];
    const url = 'pic/' + encodeURI(filename);

    // 切换时有淡出再淡入的效果
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = url;
      img.style.opacity = '1';
    }, 200);
  }

  /**
   * 切换下一张立绘
   */
  function switchPortrait() {
    currentPortraitIndex = (currentPortraitIndex + 1) % portraits.length;
    loadPortrait(currentPortraitIndex);
  }

  /**
   * 绑定立绘切换按钮
   */
  function bindPortraitSwitch() {
    const btn = document.getElementById('portraitSwitch');
    if (!btn) return;
    btn.addEventListener('click', switchPortrait);
  }

  /**
   * 初始化
   */
  function init() {
    initParticles();
    bindNavEvents();
    bindPortraitSwitch();
    loadPortrait(0);
    // 默认显示冒险页面
    switchPage('adventure');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
