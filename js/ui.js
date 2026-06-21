// ========== UI模块（升级界面、模式选择等）==========
function pickRandomChoices(n) {
  const pool = ABILITY_POOL.slice();
  const result = [];
  const secondaryChoices = [];
  if (player) {
    for (let slot of player.secondaryWeapons) {
      const weaponId = slot.id;
      const pool = SECONDARY_ABILITY_POOL[weaponId];
      if (pool) {
        for (let skill of pool) {
          secondaryChoices.push({ ...skill, weaponId });
        }
      }
    }
  }
  const fullPool = pool.concat(secondaryChoices);
  while (result.length < n && fullPool.length > 0) {
    const idx = Math.floor(Math.random() * fullPool.length);
    result.push(fullPool.splice(idx, 1)[0]);
  }
  return result;
}

function triggerLevelUpUi() {
  gamePaused = true;
  const pending = player.pendingLevelUps[0];
  const isSecondary = pending && pending.type === 'secondary';

  if (isSecondary) {
    levelUpChoices = SECONDARY_WEAPON_LIST.map(w => ({ ...w }));
    openSecondaryWeaponUi();
  } else if (pending && pending.type === 'active') {
    levelUpChoices = ACTIVE_SKILL_LIST.map(s => ({ ...s }));
    openActiveSkillUi();
  } else {
    levelUpChoices = pickRandomChoices(3);
    openLevelUpUi();
  }
}

function onChooseSecondaryWeapon(weaponId) {
  if (player.hasSecondaryWeapon(weaponId)) return;
  if (player.secondaryWeapons.length < MAX_SECONDARY_WEAPONS) {
    player.equipSecondaryWeapon(weaponId);
    player.pendingLevelUps.shift();
    closeLevelUpUi();
    if (player.pendingLevelUps.length > 0) {
      setTimeout(() => triggerLevelUpUi(), 80);
    } else {
      gamePaused = false;
    }
  } else {
    openDiscardUi(weaponId);
  }
}

function openModeSelectUi() {
  gamePaused = true;
  closeLevelUpUi();
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '✦ 选择你的模式 ✦';
  title.style.cssText = 'font-size:30px;font-weight:bold;margin-bottom:10px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.textContent = '手机模式：视野 +50%（更适合窄屏）| 电脑模式：标准视野';
  subtitle.style.cssText = 'font-size:13px;color:#aaa;margin-bottom:28px;text-align:center;';
  container.appendChild(subtitle);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:22px;flex-wrap:wrap;justify-content:center;';

  const mobileCard = document.createElement('div');
  mobileCard.style.cssText = 'width:220px;padding:26px 20px;border:2px solid #3498db;border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
  mobileCard.onmouseenter = () => { mobileCard.style.transform = 'translateY(-3px)'; mobileCard.style.boxShadow = '0 6px 16px rgba(52,152,219,0.45)'; };
  mobileCard.onmouseleave = () => { mobileCard.style.transform = 'translateY(0)'; mobileCard.style.boxShadow = 'none'; };
  mobileCard.onclick = () => {
    player.viewRangeBonus += 50;
    closeLevelUpUi();
    player.pendingLevelUps.push({ level: 1, type: 'secondary' });
    player.pendingLevelUps.push({ level: 1, type: 'active' });
    triggerLevelUpUi();
  };
  const mobileName = document.createElement('div');
  mobileName.textContent = '📱 手机模式';
  mobileName.style.cssText = 'font-size:20px;font-weight:bold;color:#3498db;margin-bottom:10px;';
  const mobileDesc = document.createElement('div');
  mobileDesc.textContent = '视野 +50%\n屏幕内能看到更多区域\n适合窄屏和移动端';
  mobileDesc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.6;white-space:pre-line;';
  mobileCard.appendChild(mobileName);
  mobileCard.appendChild(mobileDesc);
  cards.appendChild(mobileCard);

  const pcCard = document.createElement('div');
  pcCard.style.cssText = 'width:220px;padding:26px 20px;border:2px solid #9b59b6;border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
  pcCard.onmouseenter = () => { pcCard.style.transform = 'translateY(-3px)'; pcCard.style.boxShadow = '0 6px 16px rgba(155,89,182,0.45)'; };
  pcCard.onmouseleave = () => { pcCard.style.transform = 'translateY(0)'; pcCard.style.boxShadow = 'none'; };
  pcCard.onclick = () => {
    closeLevelUpUi();
    player.pendingLevelUps.push({ level: 1, type: 'secondary' });
    player.pendingLevelUps.push({ level: 1, type: 'active' });
    triggerLevelUpUi();
  };
  const pcName = document.createElement('div');
  pcName.textContent = '💻 电脑模式';
  pcName.style.cssText = 'font-size:20px;font-weight:bold;color:#9b59b6;margin-bottom:10px;';
  const pcDesc = document.createElement('div');
  pcDesc.textContent = '标准视野\n适合大屏电脑操作\n原始画面比例';
  pcDesc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.6;white-space:pre-line;';
  pcCard.appendChild(pcName);
  pcCard.appendChild(pcDesc);
  cards.appendChild(pcCard);

  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function openActiveSkillUi() {
  const choices = levelUpChoices;
  closeLevelUpUi();
  levelUpChoices = choices;
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '✹ 选择你的主动技能 ✹';
  title.style.cssText = 'font-size:26px;font-weight:bold;margin-bottom:22px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const info = document.createElement('div');
  info.textContent = '电脑按 E 键释放 / 手机点击右下角图标释放';
  info.style.cssText = 'font-size:13px;color:#aaa;margin-bottom:18px;';
  container.appendChild(info);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;justify-content:center;';

  levelUpChoices.forEach((choice) => {
    const card = document.createElement('div');
    const color = choice.color || '#f1c40f';
    card.style.cssText = 'width:220px;padding:22px 18px;border:2px solid ' + color + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
    card.onmouseenter = () => { card.style.transform = 'translateY(-3px)'; card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)'; };
    card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };
    card.onclick = () => onChooseActiveSkill(choice.id);

    const name = document.createElement('div');
    name.textContent = choice.icon + '  ' + choice.name;
    name.style.cssText = 'font-size:18px;font-weight:bold;color:' + color + ';margin-bottom:10px;';

    const desc = document.createElement('div');
    desc.textContent = choice.desc;
    desc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.4;';

    const cd = document.createElement('div');
    cd.textContent = '冷却 ' + choice.cooldown + ' 秒';
    cd.style.cssText = 'font-size:11px;color:#888;margin-top:8px;';

    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(cd);
    cards.appendChild(card);
  });
  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function onChooseActiveSkill(skillId) {
  player.equipActiveSkill(skillId);
  player.pendingLevelUps.shift();
  closeLevelUpUi();
  if (player.pendingLevelUps.length > 0) {
    setTimeout(() => triggerLevelUpUi(), 80);
  } else {
    gamePaused = false;
  }
}

function openDiscardUi(newWeaponId) {
  closeLevelUpUi();
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '⚠ 副武器已满（最多 ' + MAX_SECONDARY_WEAPONS + ' 个），请选择要丢弃的副武器，否则放弃获得新武器';
  title.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:22px;color:#f1c40f;text-align:center;max-width:620px;';
  container.appendChild(title);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;';

  player.secondaryWeapons.forEach(slot => {
    const def = slot.def;
    const card = document.createElement('div');
    card.style.cssText = 'width:200px;padding:18px 16px;border:2px solid ' + def.color + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
    card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 14px rgba(0,0,0,0.5)'; };
    card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };

    const name = document.createElement('div');
    name.textContent = '[丢弃] ' + def.name;
    name.style.cssText = 'font-size:16px;font-weight:bold;color:' + def.color + ';margin-bottom:8px;';

    const desc = document.createElement('div');
    desc.textContent = def.desc;
    desc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.4;';

    card.appendChild(name);
    card.appendChild(desc);
    card.onclick = () => {
      player.discardSecondaryWeapon(slot.id);
      player.equipSecondaryWeapon(newWeaponId);
      player.pendingLevelUps.shift();
      closeLevelUpUi();
      if (player.pendingLevelUps.length > 0) {
        setTimeout(() => triggerLevelUpUi(), 80);
      } else {
        gamePaused = false;
      }
    };
    cards.appendChild(card);
  });

  const giveUp = document.createElement('div');
  giveUp.textContent = '放弃新武器';
  giveUp.style.cssText = 'width:150px;padding:18px 16px;border:2px solid #555;border-radius:14px;background:rgba(26,26,46,0.7);cursor:pointer;transition:all 0.15s;text-align:center;font-size:14px;color:#999;';
  giveUp.onmouseenter = () => { giveUp.style.transform = 'translateY(-2px)'; };
  giveUp.onmouseleave = () => { giveUp.style.transform = 'translateY(0)'; };
  giveUp.onclick = () => {
    player.pendingLevelUps.shift();
    closeLevelUpUi();
    if (player.pendingLevelUps.length > 0) {
      setTimeout(() => triggerLevelUpUi(), 80);
    } else {
      gamePaused = false;
    }
  };
  cards.appendChild(giveUp);

  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function openSecondaryWeaponUi() {
  const choices = levelUpChoices;
  closeLevelUpUi();
  levelUpChoices = choices;
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  const pending = player.pendingLevelUps[0];
  const showLevel = pending ? pending.level : player.level;
  title.textContent = '★ 第 ' + showLevel + ' 级！选择一个副武器 ★';
  title.style.cssText = 'font-size:26px;font-weight:bold;margin-bottom:22px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const info = document.createElement('div');
  info.textContent = '当前已装备 ' + player.secondaryWeapons.length + ' / ' + MAX_SECONDARY_WEAPONS + ' 个副武器（超过上限会进入丢弃选择）';
  info.style.cssText = 'font-size:13px;color:#aaa;margin-bottom:18px;';
  container.appendChild(info);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;justify-content:center;';

  levelUpChoices.forEach((choice) => {
    const alreadyEquipped = player.hasSecondaryWeapon(choice.id);
    const card = document.createElement('div');
    const borderColor = alreadyEquipped ? '#555' : (choice.color || '#f1c40f');
    card.style.cssText = 'width:220px;padding:20px 18px;border:2px solid ' + borderColor + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;' + (alreadyEquipped ? 'opacity:0.5;cursor:not-allowed;' : '');

    if (!alreadyEquipped) {
      card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 14px rgba(0,0,0,0.5)'; };
      card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };
      card.onclick = () => onChooseSecondaryWeapon(choice.id);
    }

    const name = document.createElement('div');
    name.textContent = choice.name + (alreadyEquipped ? '（已装备）' : '');
    name.style.cssText = 'font-size:18px;font-weight:bold;color:' + borderColor + ';margin-bottom:10px;';

    const desc = document.createElement('div');
    desc.textContent = choice.desc;
    desc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.4;';

    card.appendChild(name);
    card.appendChild(desc);
    cards.appendChild(card);
  });
  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function onChooseAbility(abilityId) {
  player.applyAbility(abilityId);
  player.pendingLevelUps.shift();
  closeLevelUpUi();
  if (player.pendingLevelUps.length > 0) {
    setTimeout(() => triggerLevelUpUi(), 80);
  } else {
    gamePaused = false;
  }
}

function openLevelUpUi() {
  const choices = levelUpChoices;
  closeLevelUpUi();
  levelUpChoices = choices;
  
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '✦ 升级！选择一项能力 ✦';
  title.style.cssText = 'font-size:28px;font-weight:bold;margin-bottom:28px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;justify-content:center;';

  levelUpChoices.forEach((choice) => {
    const isSecondary = !!choice.weaponId;
    const accentColor = isSecondary ? (choice.color || '#e67e22') : 'rgba(241,196,15,0.5)';
    const nameColor = isSecondary ? (choice.color || '#e67e22') : '#f1c40f';
    const tagText = isSecondary ? '[' + (SECONDARY_WEAPON_POOL[choice.weaponId]?.name || choice.weaponId) + '专属]' : '';
    const card = document.createElement('div');
    card.dataset.abilityId = choice.id;
    card.style.cssText = 'width:200px;padding:20px 18px;border:2px solid ' + accentColor + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
    card.onmouseenter = () => {
      card.style.background = 'rgba(52,152,219,0.25)';
      card.style.borderColor = nameColor;
      card.style.transform = 'translateY(-2px)';
    };
    card.onmouseleave = () => {
      card.style.background = 'rgba(26,26,46,0.85)';
      card.style.borderColor = accentColor;
      card.style.transform = 'translateY(0)';
    };
    card.onclick = () => onChooseAbility(choice.id);

    const tag = document.createElement('div');
    tag.textContent = tagText;
    tag.style.cssText = 'font-size:10px;color:' + nameColor + ';margin-bottom:4px;opacity:0.8;';

    const name = document.createElement('div');
    name.textContent = choice.name;
    name.style.cssText = 'font-size:18px;font-weight:bold;color:' + nameColor + ';margin-bottom:10px;';

    const desc = document.createElement('div');
    desc.textContent = choice.desc;
    desc.style.cssText = 'font-size:13px;color:#ddd;line-height:1.4;';

    card.appendChild(tag);
    card.appendChild(name);
    card.appendChild(desc);
    cards.appendChild(card);
  });
  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function closeLevelUpUi() {
  if (levelUpUi && levelUpUi.parentNode) levelUpUi.parentNode.removeChild(levelUpUi);
  levelUpUi = null;
  levelUpChoices = null;
}

// ========== 暂停菜单 ==========
let _pauseMenu = null;
let _pauseBtn = null;

function ensurePauseBtn() {
  if (_pauseBtn) {
    _pauseBtn.classList.remove('hidden');
    return;
  }
  _pauseBtn = document.createElement('button');
  _pauseBtn.id = 'pauseBtn';
  _pauseBtn.textContent = 'II';
  _pauseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    togglePauseMenu();
  });
  document.body.appendChild(_pauseBtn);
}

function togglePauseMenu() {
  if (_pauseMenu) {
    closePauseMenu();
  } else {
    // 暂停时不能打开暂停（防止与升级界面重叠），已有升级界面则不响应
    if (levelUpUi) return;
    if (!player || !player.alive) return;
    openPauseMenu();
  }
}

function openPauseMenu() {
  if (_pauseMenu) return;
  gamePaused = true;
  const container = document.createElement('div');
  container.id = 'pauseMenu';

  const title = document.createElement('div');
  title.className = 'pm-title';
  title.textContent = 'II 游戏暂停';

  const sub = document.createElement('div');
  sub.className = 'pm-sub';
  sub.textContent = '按 ESC 或点击继续按钮恢复游戏';

  const stats = document.createElement('div');
  stats.className = 'pm-stats';
  const sec = Math.floor(typeof elapsedTime !== 'undefined' ? elapsedTime : (gameTime || 0));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const secList = (player.secondaryWeapons || []).map(s => s.def.name).join('、') || '无';
  const skillName = player.activeSkillId ? (ACTIVE_SKILL_POOL[player.activeSkillId]?.name || '-') : '无';
  stats.innerHTML =
    '<div><b>等级</b>' + (player.level || 1) + '</div>' +
    '<div><b>HP</b>' + Math.round(player.hp || 0) + ' / ' + Math.round(player.maxHp || 0) + '</div>' +
    '<div><b>攻击力</b>' + (Math.round(player.effectiveDamage * 10) / 10) + '</div>' +
    '<div><b>生存时间</b>' + mm + ':' + ss + '</div>' +
    '<div><b>击杀数</b>' + (window._killCount || 0) + '</div>' +
    '<div><b>副武器</b>' + secList + '</div>' +
    '<div><b>主动技能</b>' + skillName + '</div>';

  const resumeBtn = document.createElement('div');
  resumeBtn.className = 'pm-btn pm-resume';
  resumeBtn.textContent = '▶ 继续游戏';
  resumeBtn.addEventListener('click', () => closePauseMenu());

  const restartBtn = document.createElement('div');
  restartBtn.className = 'pm-btn pm-restart';
  restartBtn.textContent = '⟳ 重新开始';
  restartBtn.addEventListener('click', () => {
    closePauseMenu();
    if (typeof restart === 'function') restart();
  });

  const debugBtn = document.createElement('div');
  debugBtn.className = 'pm-btn pm-debug';
  debugBtn.textContent = '🔧 开发者面板';
  debugBtn.addEventListener('click', () => {
    if (typeof createDevPanel === 'function') {
      if (typeof devPanel !== 'undefined' && devPanel) {
        devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
      } else {
        createDevPanel();
      }
      // 不关闭暂停菜单：开发者面板 z-index 700 高于暂停菜单 600，自然覆盖显示
    }
  });

  const mapBtn = document.createElement('div');
  mapBtn.className = 'pm-btn pm-map';
  mapBtn.textContent = '🗺 选择地图';
  mapBtn.addEventListener('click', () => {
    closePauseMenu();
    openMapSelectMenu();
  });

  const homeBtn = document.createElement('div');
  homeBtn.className = 'pm-btn pm-home';
  homeBtn.textContent = '⌂ 返回主页';
  homeBtn.addEventListener('click', () => {
    closePauseMenu();
    if (window.GameCore && typeof window.GameCore.returnToHomepage === 'function') {
      window.GameCore.returnToHomepage();
    } else {
      location.reload();
    }
  });

  const hint = document.createElement('div');
  hint.className = 'pm-hint';
  hint.textContent = '电脑：按 ESC 切换暂停 / 继续\n手机：点击右上角按钮切换暂停';

  container.appendChild(title);
  container.appendChild(sub);
  container.appendChild(stats);
  container.appendChild(resumeBtn);
  container.appendChild(mapBtn);
  container.appendChild(debugBtn);
  container.appendChild(restartBtn);
  container.appendChild(homeBtn);
  container.appendChild(hint);
  document.body.appendChild(container);
  _pauseMenu = container;
}

function closePauseMenu() {
  if (!_pauseMenu) return;
  if (_pauseMenu.parentNode) _pauseMenu.parentNode.removeChild(_pauseMenu);
  _pauseMenu = null;
  gamePaused = false;
}

// ========== 地图选择菜单 ==========
let _mapSelectMenu = null;

// 地图列表（由 Python 脚本自动生成）
// 运行: python map_index_generator.py
const MAP_LIST = []; // 动态加载，见 loadMapList()

// 地图列表加载器：优先读内联数据（兼容 file://），其次回退到 fetch 索引
let _mapListLoaded = false;
async function loadMapList() {
  if (_mapListLoaded) return MAP_LIST;
  // 优先使用内联数据（由 js/map_data.js 提供 window.MAP_INDEX_DATA）
  if (window.MAP_INDEX_DATA && Array.isArray(window.MAP_INDEX_DATA) && window.MAP_INDEX_DATA.length > 0) {
    if (window.LOG) window.LOG('ui.js: 使用内联 MAP_INDEX_DATA（兼容 file:// 模式），共 ' + window.MAP_INDEX_DATA.length + ' 张地图');
    MAP_LIST.length = 0;
    MAP_LIST.push(...window.MAP_INDEX_DATA);
    _mapListLoaded = true;
    return MAP_LIST;
  }
  if (window.LOG) window.LOG('ui.js: MAP_INDEX_DATA 不可用，尝试 fetch 模式');
  // 回退：fetch 方式（HTTP 服务模式）
  try {
    const res = await fetch('地图/map_index.json');
    if (res.ok) {
      const data = await res.json();
      MAP_LIST.length = 0;
      for (const m of (data.maps || [])) {
        // 兼容索引的扁平字段格式，转成与单个 map*.json 一致的结构
        MAP_LIST.push({
          name: m.name || '未命名地图',
          world: m.world || { width: m.width || 1600, height: m.height || 900 },
          playerSpawn: m.playerSpawn || { x: m.spawnX || 800, y: m.spawnY || 450 },
          walls: m.walls || [],
        });
      }
      _mapListLoaded = true;
      if (window.LOG) window.LOG('ui.js: fetch 模式加载地图列表，共 ' + MAP_LIST.length + ' 张');
    } else if (window.LOG_ERROR) {
      window.LOG_ERROR('ui.js: fetch 地图索引失败 status=' + res.status);
    }
  } catch (e) {
    if (window.LOG_ERROR) window.LOG_ERROR('ui.js: fetch 地图索引异常: ' + (e && e.message ? e.message : e));
    console.warn('无法加载地图列表:', e);
  }
  return MAP_LIST;
}

function openMapSelectMenu() {
  if (_mapSelectMenu) return;
  gamePaused = true;

  const container = document.createElement('div');
  container.id = 'mapSelectMenu';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none';

  const title = document.createElement('div');
  title.textContent = '🗺 选择地图';
  title.style.cssText = 'font-size:28px;font-weight:bold;color:#58a6ff;margin-bottom:8px;text-shadow:0 2px 8px rgba(0,0,0,.6)';

  const sub = document.createElement('div');
  sub.id = 'mapSelectSub';
  sub.textContent = '正在加载地图...';
  sub.style.cssText = 'font-size:13px;color:#888;margin-bottom:28px';

  const mapGrid = document.createElement('div');
  mapGrid.id = 'mapGrid';
  mapGrid.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;max-width:750px;max-height:60vh;overflow-y:auto;padding:10px;';
  mapGrid.style.scrollbarWidth = 'thin';
  mapGrid.style.scrollbarColor = '#30363d #161b22';

  const backBtn = document.createElement('div');
  backBtn.style.cssText = 'padding:12px 28px;border:2px solid #555;border-radius:8px;background:rgba(26,26,46,.85);cursor:pointer;font-size:14px;color:#aaa;transition:all .15s';
  backBtn.textContent = '← 返回暂停菜单';
  backBtn.onmouseenter = () => { backBtn.style.borderColor = '#888'; backBtn.style.color = '#fff'; };
  backBtn.onmouseleave = () => { backBtn.style.borderColor = '#555'; backBtn.style.color = '#aaa'; };
  backBtn.onclick = () => closeMapSelectMenu();

  container.appendChild(title);
  container.appendChild(sub);
  container.appendChild(mapGrid);
  container.appendChild(backBtn);
  document.body.appendChild(container);
  _mapSelectMenu = container;

  // 异步加载地图列表并渲染
  loadMapList().then(maps => {
    const grid = document.getElementById('mapGrid');
    const subEl = document.getElementById('mapSelectSub');
    if (!grid || !subEl) return;
    grid.innerHTML = '';
    if (maps.length === 0) {
      subEl.textContent = '未找到地图文件，请先使用地图编辑器创建地图';
      return;
    }
    subEl.textContent = '选择后将加载新地图并重新开始';
    maps.forEach((md) => {
      const card = document.createElement('div');
      card.style.cssText = 'width:360px;padding:12px;border:2px solid #30363d;border-radius:12px;background:rgba(26,26,46,.9);cursor:pointer;transition:all .15s;text-align:center';
      card.onmouseenter = () => { card.style.transform = 'translateY(-3px)'; card.style.borderColor = '#58a6ff'; card.style.boxShadow = '0 4px 16px rgba(88,166,255,.3)'; };
      card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.borderColor = '#30363d'; card.style.boxShadow = 'none'; };
      card.onclick = () => loadMapAndRestart(md);

      // 地图预览 Canvas - 增大尺寸
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 340;
      previewCanvas.height = 180;
      previewCanvas.style.cssText = 'border-radius:6px;margin-bottom:10px;background:#0a0c10;display:block;margin-left:auto;margin-right:auto;';
      renderMapPreview(previewCanvas, md);

      const name = document.createElement('div');
      name.textContent = md.name || '未命名地图';
      name.style.cssText = 'font-size:14px;font-weight:bold;color:#e6edf3;margin-bottom:2px';

      const desc = document.createElement('div');
      const walls = md.walls ? md.walls.length + ' 个墙体' : '';
      const dim = md.world ? ' | ' + md.world.width + '×' + md.world.height : '';
      desc.textContent = walls + dim;
      desc.style.cssText = 'font-size:11px;color:#777';

      card.appendChild(previewCanvas);
      card.appendChild(name);
      card.appendChild(desc);
      grid.appendChild(card);
    });
  });
}

// 渲染地图预览
function renderMapPreview(canvas, mapData) {
  if (window.LOG_DEBUG) window.LOG_DEBUG('renderMapPreview: ' + (mapData.name || '未命名') + ' walls=' + ((mapData.walls && mapData.walls.length) || 0));
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // 清空画布 - 使用深色背景带网格
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);

  // 计算缩放比例 - 让地图尽可能填满预览区域
  const mapW = (mapData.world && mapData.world.width) || mapData.width || 1600;
  const mapH = (mapData.world && mapData.world.height) || mapData.height || 900;
  if (window.LOG_DEBUG) window.LOG_DEBUG('  地图尺寸: ' + mapW + '×' + mapH + ' canvas: ' + w + '×' + h);
  const padding = 8;
  const availableW = w - padding * 2;
  const availableH = h - padding * 2;
  const scale = Math.min(availableW / mapW, availableH / mapH);
  const offsetX = (w - mapW * scale) / 2;
  const offsetY = (h - mapH * scale) / 2;

  // 绘制网格背景
  ctx.strokeStyle = '#1a1f26';
  ctx.lineWidth = 0.5;
  const gridSize = 40 * scale;
  for (let x = offsetX; x < offsetX + mapW * scale; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + mapH * scale);
    ctx.stroke();
  }
  for (let y = offsetY; y < offsetY + mapH * scale; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + mapW * scale, y);
    ctx.stroke();
  }

  // 绘制地图边界
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, mapW * scale, mapH * scale);

  // 墙体颜色
  const wallColors = {
    low: { fill: 'rgba(107,142,78,0.8)', stroke: '#8ab066' },
    mid: { fill: 'rgba(154,154,154,0.8)', stroke: '#b8b8b8' },
    high: { fill: 'rgba(90,90,142,0.8)', stroke: '#7878b8' }
  };

  // 绘制墙体 —— 保护：跳过 null/undefined 元素
  if (mapData.walls && mapData.walls.length > 0) {
    let renderedWalls = 0;
    for (let wi = 0; wi < mapData.walls.length; wi++) {
      const wall = mapData.walls[wi];
      if (!wall || typeof wall !== 'object') {
        if (window.LOG_WARN) window.LOG_WARN('renderMapPreview: 墙体 #' + wi + ' 非对象，跳过');
        continue;
      }
      const colors = wallColors[wall.type] || wallColors.mid;
      const x = offsetX + (wall.x || 0) * scale;
      const y = offsetY + (wall.y || 0) * scale;
      const wallW = (wall.w || 0) * scale;
      const wallH = (wall.h || 0) * scale;

      ctx.fillStyle = colors.fill;
      ctx.fillRect(x, y, wallW, wallH);
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, wallW, wallH);
      renderedWalls++;
    }
    if (window.LOG_DEBUG) window.LOG_DEBUG('  成功渲染 ' + renderedWalls + '/' + mapData.walls.length + ' 个墙体');
  }

  // 绘制玩家出生点
  let spawnX = null, spawnY = null;
  if (mapData.playerSpawn && mapData.playerSpawn.x != null && mapData.playerSpawn.y != null) {
    spawnX = mapData.playerSpawn.x;
    spawnY = mapData.playerSpawn.y;
  } else if (mapData.spawnX != null && mapData.spawnY != null) {
    spawnX = mapData.spawnX;
    spawnY = mapData.spawnY;
  }
  if (spawnX != null && spawnY != null) {
    const px = offsetX + spawnX * scale;
    const py = offsetY + spawnY * scale;
    if (window.LOG_DEBUG) window.LOG_DEBUG('  玩家出生点: (' + spawnX + ',' + spawnY + ') → canvas (' + Math.round(px) + ',' + Math.round(py) + ')');
    // 外圈
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#3fb950';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 内圈
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3fb950';
    ctx.fill();
  } else if (window.LOG_DEBUG) {
    window.LOG_DEBUG('  无玩家出生点信息');
  }
}

function closeMapSelectMenu() {
  if (!_mapSelectMenu) return;
  if (_mapSelectMenu.parentNode) _mapSelectMenu.parentNode.removeChild(_mapSelectMenu);
  _mapSelectMenu = null;
  gamePaused = false;
}

// 参数：支持直接传地图数据对象，或兼容原本地图文件路径
async function loadMapAndRestart(mapInput) {
  try {
    // 显示加载提示
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'mapLoadingOverlay';
    loadingOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff';
    loadingOverlay.innerHTML = '<div style="font-size:24px;margin-bottom:12px">🗺</div><div>正在加载地图...</div><div id="mapLoadingProgress" style="font-size:12px;color:#888;margin-top:8px">准备中</div>';
    document.body.appendChild(loadingOverlay);

    closeMapSelectMenu();

    const progress = document.getElementById('mapLoadingProgress');
    let mapData;
    if (typeof mapInput === 'object' && mapInput !== null) {
      // 直接传入地图数据对象（内联模式）
      mapData = mapInput;
      progress.textContent = '应用地图数据...';
    } else if (typeof mapInput === 'string') {
      // 兼容：传入文件路径（HTTP 模式）
      progress.textContent = '正在获取地图数据...';
      const response = await fetch(mapInput);
      if (!response.ok) throw new Error('地图加载失败');
      mapData = await response.json();
      progress.textContent = '正在解析地图数据...';
    } else {
      throw new Error('无效的地图输入');
    }

    // 保存地图数据到全局变量，供 init() 使用
    window._pendingMapData = mapData;

    if (window.LOG) window.LOG('ui.js: loadMapAndRestart 收到地图数据，名称=' + (mapData.name || '未命名') + ' walls=' + ((mapData.walls && mapData.walls.length) || 0));

    // 应用世界尺寸（立即生效，供后续使用）— 同时更新脚本作用域绑定 + window 属性
    if (mapData.world) {
      setWorldSize(mapData.world.width, mapData.world.height, 'ui.js: loadMapAndRestart("' + (mapData.name || '未命名') + '")');
    }

    progress.textContent = '即将重新开始...';

    // 短暂延迟后重新开始游戏
    setTimeout(() => {
      if (loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);
      if (typeof restart === 'function') restart();
    }, 300);

  } catch (error) {
    if (window.LOG_ERROR) window.LOG_ERROR('地图加载失败: ' + error.message);
    console.error('地图加载失败:', error);
    alert('地图加载失败: ' + error.message);
    if (document.getElementById('mapLoadingOverlay')) {
      document.getElementById('mapLoadingOverlay').parentNode.removeChild(document.getElementById('mapLoadingOverlay'));
    }
    gamePaused = false;
  }
}

// ========== 通用：打开地图选择（拖拽滑动版 —— 手机/电脑统一用拖动来滚动）==========
function openMapSelection(callback) {
  if (window.LOG) window.LOG('ui.js: 打开地图选择界面');
  if (document.getElementById('mapSelectionModal')) return;

  // 1. 模态框（固定全屏，z-index 确保在主页之上）
  const modal = document.createElement('div');
  modal.id = 'mapSelectionModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit;color:#fff;user-select:none;padding:20px;box-sizing:border-box;overflow:hidden;';

  // 标题
  const title = document.createElement('div');
  title.textContent = '🗺 选择地图';
  title.style.cssText = 'font-size:28px;font-weight:bold;color:#d4af37;margin-bottom:8px;text-shadow:0 0 20px rgba(212,175,55,0.3);';

  // 副标题（告诉用户如何操作）
  const sub = document.createElement('div');
  sub.id = 'mapSelectionSub';
  sub.textContent = '正在加载地图列表...';
  sub.style.cssText = 'font-size:13px;color:#888;margin-bottom:16px;';

  // 2. 滑动视口（固定高度，溢出隐藏，实际滚动靠内部 translateY）
  // 这是"可视窗口"——用户看到的卡片区域
  const viewport = document.createElement('div');
  viewport.id = 'mapSelectionViewport';
  viewport.style.cssText = 'position:relative;max-width:950px;height:60vh;background:#1a1b2e;border:3px solid #d4af37;border-radius:14px;box-sizing:border-box;overflow:hidden;box-shadow:0 0 30px rgba(212,175,55,0.2);touch-action:none;-webkit-overflow-scrolling:touch;';

  // 3. 内容容器（放在视口内，通过 translateY 上下移动模拟滚动）
  // 这是"卡片列表"——随拖动而移动
  const content = document.createElement('div');
  content.id = 'mapSelectionContent';
  content.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-content:flex-start;padding:16px;box-sizing:border-box;transition:transform 0.15s ease-out;will-change:transform;';

  viewport.appendChild(content);

  // 4. 关闭按钮
  const closeBtn = document.createElement('div');
  closeBtn.textContent = '← 返回';
  closeBtn.style.cssText = 'padding:12px 28px;border:2px solid #555;border-radius:8px;background:rgba(26,26,46,0.85);cursor:pointer;font-size:14px;color:#aaa;transition:all 0.15s ease;margin-top:20px;';
  closeBtn.onmouseenter = function() { closeBtn.style.borderColor = '#d4af37'; closeBtn.style.color = '#fff'; };
  closeBtn.onmouseleave = function() { closeBtn.style.borderColor = '#555'; closeBtn.style.color = '#aaa'; };
  closeBtn.onclick = function() {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    if (callback) callback(null);
  };

  modal.appendChild(title);
  modal.appendChild(sub);
  modal.appendChild(viewport);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);

  // ========== 5. 拖拽滑动核心逻辑（鼠标 + 触摸通用） ==========
  let dragStartY = 0;        // 手指/鼠标按下时的 Y 坐标
  let dragStartOffset = 0;   // 按下时 content 的当前 translateY
  let currentOffset = 0;     // 当前 content 的 translateY 偏移
  let isDragging = false;    // 是否正在拖拽
  let dragMoved = false;     // 本次拖拽是否真的移动了（用于区分"点击"和"拖动"）
  let maxOffset = 0;         // 向下滚动的最大偏移量（负值，因为向上移显示下面的内容）
  let velocity = 0;          // 滑动速度（用于惯性动画）
  let lastMoveY = 0;         // 上一次 move 事件的 Y 坐标
  let lastMoveTime = 0;      // 上一次 move 事件的时间
  let rafId = null;          // requestAnimationFrame ID

  // 计算可滚动范围（视口高度 vs 内容总高度）
  function updateScrollRange() {
    // content 总高度 - 视口高度 = 还能向下滚动的量
    maxOffset = Math.min(0, viewport.clientHeight - content.scrollHeight);
    // 比如视口 500px，内容 1400px，maxOffset = -900
    // currentOffset 范围应该是 [maxOffset, 0]
  }

  // 应用 translateY 并做边界限制
  function applyOffset(offset) {
    currentOffset = Math.max(maxOffset, Math.min(0, offset));
    content.style.transform = 'translateY(' + currentOffset + 'px)';
    content.style.transition = 'none'; // 拖动时无过渡，即时响应
  }

  // 带弹性的边界回弹（当拖到边界外时，有"橡皮筋"效果）
  function applyElasticOffset(offset) {
    if (offset > 0) {
      // 顶部越界：阻尼效果
      currentOffset = offset * 0.3;
    } else if (offset < maxOffset) {
      // 底部越界
      currentOffset = maxOffset + (offset - maxOffset) * 0.3;
    } else {
      currentOffset = offset;
    }
    content.style.transform = 'translateY(' + currentOffset + 'px)';
    content.style.transition = 'none';
  }

  // 带过渡效果的位置（松手后回弹/惯性用）
  function animateTo(offset) {
    currentOffset = Math.max(maxOffset, Math.min(0, offset));
    content.style.transition = 'transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)';
    content.style.transform = 'translateY(' + currentOffset + 'px)';
  }

  // 开始拖拽（鼠标按下 或 手指按下）
  function handleDragStart(y) {
    isDragging = true;
    dragMoved = false;
    dragStartY = y;
    dragStartOffset = currentOffset;
    lastMoveY = y;
    lastMoveTime = Date.now();
    velocity = 0;
    // 停止正在进行的惯性动画
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    content.style.transition = 'none';
  }

  // 拖动中（鼠标移动 或 手指移动）
  function handleDragMove(y) {
    if (!isDragging) return;
    const deltaY = y - dragStartY;
    if (Math.abs(deltaY) > 5) dragMoved = true; // 移动超过 5px 算拖动，不算点击

    // 记录速度（用于惯性）
    const now = Date.now();
    const dt = now - lastMoveTime;
    if (dt > 0) {
      velocity = (y - lastMoveY) / dt; // px/ms
    }
    lastMoveY = y;
    lastMoveTime = now;

    // 计算新偏移（dragStartOffset 为基准 + deltaY，因为手指向下移=内容向下移）
    applyElasticOffset(dragStartOffset + deltaY);
  }

  // 结束拖拽（鼠标松开 或 手指抬起）——带惯性滑动
  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    // 如果在边界外，先回弹
    if (currentOffset > 0 || currentOffset < maxOffset) {
      animateTo(currentOffset > 0 ? 0 : maxOffset);
      return;
    }

    // 否则执行惯性滑动
    if (Math.abs(velocity) > 0.1) {
      // velocity 是 px/ms，转换成总滑行距离
      // 惯性衰减：每帧减速
      let currentVel = velocity * 16; // 转换成 px/frame 近似
      let pos = currentOffset;

      function inertiaStep() {
        currentVel *= 0.94; // 衰减系数
        pos += currentVel;
        // 检查边界
        if (pos > 0) {
          pos = 0;
          animateTo(0);
          rafId = null;
          return;
        }
        if (pos < maxOffset) {
          pos = maxOffset;
          animateTo(maxOffset);
          rafId = null;
          return;
        }
        applyOffset(pos);
        if (Math.abs(currentVel) > 0.5) {
          rafId = requestAnimationFrame(inertiaStep);
        } else {
          rafId = null;
        }
      }
      rafId = requestAnimationFrame(inertiaStep);
    }
  }

  // ====== 绑定事件 ======
  // 鼠标事件（桌面端）
  viewport.addEventListener('mousedown', function(e) {
    handleDragStart(e.clientY);
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      handleDragMove(e.clientY);
      e.preventDefault();
    }
  });
  document.addEventListener('mouseup', function() {
    if (isDragging) handleDragEnd();
  });

  // 触摸事件（手机端）
  viewport.addEventListener('touchstart', function(e) {
    handleDragStart(e.touches[0].clientY);
  }, { passive: true });
  viewport.addEventListener('touchmove', function(e) {
    handleDragMove(e.touches[0].clientY);
    e.preventDefault();
  }, { passive: false });
  viewport.addEventListener('touchend', function() {
    handleDragEnd();
  });

  // 鼠标滚轮（桌面端备用）
  viewport.addEventListener('wheel', function(e) {
    // 有滚轮就用滚轮滚动
    applyOffset(currentOffset - e.deltaY);
    e.preventDefault();
  }, { passive: false });

  // ========== 6. 加载地图卡片 ==========
  loadMapList().then(maps => {
    sub.textContent = '上下拖动滑动查看地图，点击地图卡片开始游戏';

    for (let i = 0; i < maps.length; i++) {
      const md = maps[i];
      try {
        const card = document.createElement('div');
        card.style.cssText = 'width:280px;padding:12px;border:2px solid #3a3b4e;border-radius:12px;background:rgba(30,30,50,0.9);cursor:pointer;transition:all 0.2s ease;text-align:center;box-sizing:border-box;';

        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 260;
        previewCanvas.height = 140;
        previewCanvas.style.cssText = 'border-radius:6px;margin-bottom:10px;background:#0a0c10;display:block;margin-left:auto;margin-right:auto;pointer-events:none;';

        const name = document.createElement('div');
        name.textContent = md.name || '未命名地图';
        name.style.cssText = 'font-size:14px;font-weight:bold;color:#e6edf3;margin-bottom:4px;pointer-events:none;';

        const desc = document.createElement('div');
        const wallCount = (md.walls || []).length;
        const w = md.world ? md.world.width : 1600;
        const h = md.world ? md.world.height : 900;
        desc.textContent = wallCount + ' 个墙体 | ' + w + '×' + h;
        desc.style.cssText = 'font-size:11px;color:#888;pointer-events:none;';

        card.appendChild(previewCanvas);
        card.appendChild(name);
        card.appendChild(desc);
        content.appendChild(card);

        // 卡片悬停样式
        card.onmouseenter = function() {
          if (!isDragging) {
            card.style.borderColor = '#d4af37';
            card.style.transform = 'translateY(-3px)';
            card.style.boxShadow = '0 4px 20px rgba(212,175,55,0.3)';
          }
        };
        card.onmouseleave = function() {
          card.style.borderColor = '#3a3b4e';
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = 'none';
        };

        // 卡片点击（用 touchend/mousedown 判断"短点击" vs "拖动"）
        card.addEventListener('click', function(e) {
          // 如果本次是拖动操作，不触发点击
          if (dragMoved) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          if (modal.parentNode) modal.parentNode.removeChild(modal);
          if (callback) callback(md);
        });

        renderMapPreview(previewCanvas, md);
      } catch (err) {
        // 跳过出错的地图
      }
    }

    // 所有卡片创建完后，计算可滚动范围
    setTimeout(function() {
      updateScrollRange();
      // 重置位置到顶部
      applyOffset(0);
    }, 50);

    if (window.LOG) window.LOG('ui.js: 共 ' + maps.length + ' 张地图卡片已创建 ✓（拖拽滑动模式）');
  });

  // 窗口大小改变时重新计算滚动范围
  window.addEventListener('resize', updateScrollRange);
}
// ========== 统一暴露 GameUI 命名空间 ==========
window.GameUI = {
  openMapSelection: openMapSelection,
};
