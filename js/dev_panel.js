// ========== 开发者面板模块 ==========
let devPanel = null;

function createDevPanel() {
  if (devPanel) return;
  
  const panel = document.createElement('div');
  panel.id = 'devPanel';
  panel.style.cssText = 'position:fixed;top:12px;right:12px;background:rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.3);border-radius:8px;padding:12px;font-family:Arial,sans-serif;color:#fff;font-size:12px;z-index:400;user-select:none;min-width:140px;';
  
  const title = document.createElement('div');
  title.textContent = '🔧 开发者面板';
  title.style.cssText = 'font-weight:bold;margin-bottom:10px;color:#f1c40f;';
  panel.appendChild(title);
  
  const atkBtn = document.createElement('button');
  atkBtn.textContent = '攻速 +20%';
  atkBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#3498db;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  atkBtn.onclick = () => {
    player.applyAbility('attack_speed');
  };
  panel.appendChild(atkBtn);
  
  const critBtn = document.createElement('button');
  critBtn.textContent = '暴击 +10%';
  critBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#e74c3c;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  critBtn.onclick = () => {
    player.applyAbility('crit_chance');
  };
  panel.appendChild(critBtn);
  
  const hpBtn = document.createElement('button');
  hpBtn.textContent = '生命 +10';
  hpBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#2ecc71;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  hpBtn.onclick = () => {
    player.applyAbility('hp_max');
  };
  panel.appendChild(hpBtn);
  
  const xpBtn = document.createElement('button');
  xpBtn.textContent = '经验 +50';
  xpBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#9b59b6;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  xpBtn.onclick = () => {
    player.addXp(50);
  };
  panel.appendChild(xpBtn);

  const dmgBtn = document.createElement('button');
  dmgBtn.textContent = '伤害 +2';
  dmgBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#e67e22;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  dmgBtn.onclick = () => {
    player.applyAbility('damage');
  };
  panel.appendChild(dmgBtn);

  const viewBtn = document.createElement('button');
  viewBtn.textContent = '视野 +5%';
  viewBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#1abc9c;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  viewBtn.onclick = () => {
    player.applyAbility('view_range');
  };
  panel.appendChild(viewBtn);

  const atkRngBtn = document.createElement('button');
  atkRngBtn.textContent = '攻击范围 +5';
  atkRngBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#8e44ad;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  atkRngBtn.onclick = () => {
    player.applyAbility('attack_range');
  };
  panel.appendChild(atkRngBtn);

  const pickBtn = document.createElement('button');
  pickBtn.textContent = '吸取范围 +5';
  pickBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#16a085;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  pickBtn.onclick = () => {
    player.applyAbility('pickup_range');
  };
  panel.appendChild(pickBtn);

  const xpMulBtn = document.createElement('button');
  const updateXpMulText = () => {
    xpMulBtn.textContent = '经验 x' + (player.expMultiplier || 1) + '（切换）';
  };
  updateXpMulText();
  xpMulBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#d35400;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  xpMulBtn.onclick = () => {
    const cur = player.expMultiplier || 1;
    player.expMultiplier = cur === 1 ? 5 : cur === 5 ? 10 : 1;
    updateXpMulText();
  };
  panel.appendChild(xpMulBtn);

  const sep = document.createElement('hr');
  sep.style.cssText = 'width:100%;border:none;border-top:1px solid rgba(255,255,255,0.2);margin:8px 0;';
  panel.appendChild(sep);

  const sepTitle = document.createElement('div');
  sepTitle.textContent = '⚔ 武器控制';
  sepTitle.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#e74c3c;font-size:11px;';
  panel.appendChild(sepTitle);

  const primaryBtn = document.createElement('button');
  const updatePrimaryBtn = () => {
    primaryBtn.textContent = '主武器: ' + (weaponAttackDisabled.primary ? '已停止' : '进行中');
    primaryBtn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.primary ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updatePrimaryBtn();
  primaryBtn.onclick = () => {
    weaponAttackDisabled.primary = !weaponAttackDisabled.primary;
    updatePrimaryBtn();
  };
  panel.appendChild(primaryBtn);

  const slot1Btn = document.createElement('button');
  const updateSlot1Btn = () => {
    slot1Btn.textContent = '1号副武器: ' + (weaponAttackDisabled.slot1 ? '已停止' : '进行中');
    slot1Btn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.slot1 ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updateSlot1Btn();
  slot1Btn.onclick = () => {
    weaponAttackDisabled.slot1 = !weaponAttackDisabled.slot1;
    updateSlot1Btn();
  };
  panel.appendChild(slot1Btn);

  const slot2Btn = document.createElement('button');
  const updateSlot2Btn = () => {
    slot2Btn.textContent = '2号副武器: ' + (weaponAttackDisabled.slot2 ? '已停止' : '进行中');
    slot2Btn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.slot2 ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updateSlot2Btn();
  slot2Btn.onclick = () => {
    weaponAttackDisabled.slot2 = !weaponAttackDisabled.slot2;
    updateSlot2Btn();
  };
  panel.appendChild(slot2Btn);

  const slot3Btn = document.createElement('button');
  const updateSlot3Btn = () => {
    slot3Btn.textContent = '3号副武器: ' + (weaponAttackDisabled.slot3 ? '已停止' : '进行中');
    slot3Btn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.slot3 ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updateSlot3Btn();
  slot3Btn.onclick = () => {
    weaponAttackDisabled.slot3 = !weaponAttackDisabled.slot3;
    updateSlot3Btn();
  };
  panel.appendChild(slot3Btn);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '隐藏面板';
  closeBtn.style.cssText = 'width:100%;padding:4px 10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);border-radius:4px;color:#aaa;cursor:pointer;font-size:10px;margin-top:4px;';
  closeBtn.onclick = () => {
    panel.style.display = 'none';
  };
  panel.appendChild(closeBtn);
  
  document.body.appendChild(panel);
  devPanel = panel;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    if (devPanel) {
      devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
    } else {
      createDevPanel();
    }
  }
});