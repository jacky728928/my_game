// ========== 游戏常量 ==========
// 注意：WORLD_W / WORLD_H 用 let 而非 const，以便地图选择时动态重赋值
// （经典 script 中 const 不会挂到 window，且不可重赋值）
let WORLD_W = 2400;
let WORLD_H = 2400;

// 统一修改世界尺寸的函数 —— 保证脚本作用域变量 + window 属性同步，且触发日志
function setWorldSize(w, h, reason) {
  const oldW = WORLD_W, oldH = WORLD_H;
  WORLD_W = w;
  WORLD_H = h;
  window.WORLD_W = w;
  window.WORLD_H = h;
  if (window.LOG) {
    window.LOG('世界尺寸更新: (' + oldW + '×' + oldH + ') → (' + w + '×' + h + ') 原因: ' + (reason || '未知'));
  }
}
// 显式挂到 window，确保 index.html 内联脚本和其他模块都能访问
window.setWorldSize = setWorldSize;

if (window.LOG) window.LOG('constants.js 已加载，初始 WORLD=' + WORLD_W + '×' + WORLD_H);

// 玩家
const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 180;        // 像素/秒
const PLAYER_MAX_HP = 200;

// 武器
const PISTOL_RANGE = 250;        // 攻击范围半径
const PISTOL_DAMAGE = 5;
const PISTOL_INTERVAL = 0.8;    // 攻击间隔(秒)
const BULLET_SPEED = 400;
const BULLET_RADIUS = 4;

// 敌人 - 6级预设 (HP=等级×10, 随机移速)
const ENEMY_TIERS = [
  { level: 1, hp: 10,  size: 22, speedMin: 100, speedMax: 155, color: '#e74c3c', glow: '#f1948a' },
  { level: 2, hp: 20,  size: 26, speedMin:  90, speedMax: 145, color: '#e67e22', glow: '#f0b27a' },
  { level: 3, hp: 40,  size: 30, speedMin:  80, speedMax: 135, color: '#f1c40f', glow: '#f9e054' },
  { level: 4, hp: 60,  size: 34, speedMin:  70, speedMax: 125, color: '#2ecc71', glow: '#82e0aa' },
  { level: 5, hp: 80,  size: 38, speedMin:  60, speedMax: 115, color: '#3498db', glow: '#85c1e9' },
  { level: 6, hp: 100,  size: 42, speedMin:  50, speedMax: 105, color: '#9b59b6', glow: '#c39bd3' },
];
const SPAWN_INTERVAL_INIT = 2.5;
const SPAWN_INTERVAL_MIN = 0.6;
const SPAWN_INTERVAL_DECAY = 0.02;

// 颜色
const COLOR_BG = '#1a1a2e';
const COLOR_GRID = 'rgba(255,255,255,0.04)';
const COLOR_PLAYER = '#3498db';
const COLOR_PLAYER_STROKE = '#5dade2';
const COLOR_BULLET = '#f1c40f';
const COLOR_RANGE = 'rgba(52,152,219,0.12)';
const COLOR_DAMAGE_FLASH = 'rgba(231,76,60,0.35)';
const COLOR_HP_BG = 'rgba(0,0,0,0.55)';
const COLOR_HP_LOW = '#e74c3c';
const COLOR_HP_MID = '#f39c12';
const COLOR_HP_HIGH = '#2ecc71';

// 小地图
const MINIMAP_SIZE = 120;

// 伤害闪光持续时间
const DAMAGE_FLASH_DURATION = 0.25;

// 经验系统
const XP_PICKUP_RANGE = 70;            // 自动拾取范围（半径）
const XP_ORB_BASE_RADIUS = 5;
const XP_LEVEL_BASE = 20;              // 升级所需 = 等级 × 20
const XP_ORB_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
const XP_BAR_COLOR = '#f1c40f';        // 经验条金色
const XP_FLY_SPEED = 420;              // 经验球飞向角色的最大速度

// 暴击系统
const CRIT_MULTIPLIER_BASE = 1.5;      // 初始暴击倍率 150%

// 能力升级选项（升级时随机三选一）
const ABILITY_POOL = [
  { id: 'hp_max',       name: '坚韧体魄', desc: '最大生命 +10，同时恢复 10 HP' },
  { id: 'attack_speed',  name: '急速射击', desc: '攻速 +20%（攻击间隔缩短）' },
  { id: 'crit_chance',  name: '致命一击', desc: '暴击概率 +10%（初始暴击倍率 150%）' },
  { id: 'damage',        name: '强化火力', desc: '基础攻击 +2 点伤害' },
  { id: 'view_range',    name: '鹰眼视野', desc: '视野范围 +25%（显示更大区域）' },
  { id: 'attack_range',  name: '超距感知', desc: '攻击范围 +25 px' },
  { id: 'pickup_range',  name: '灵力汲取', desc: '经验吸取范围 +25 px' },
];

// 副武器专属技能池（需持有对应副武器才有概率抽到）
const SECONDARY_ABILITY_POOL = {
  grenade_launcher: [
    { id: 'gl_firepower', name: '火力倾泻', desc: '榴弹数量 +1（每级额外发射一颗榴弹）', color: '#e67e22' },
  ],
  grenade: [
    { id: 'gr_cluster', name: '集束手雷', desc: '手雷伤害 +50%/级（等级越高，爆炸越致命）', color: '#e74c3c' },
  ],
  medkit: [
    { id: 'mk_healboost', name: '急救强化', desc: '医疗包回复量 +50%/级（持续强化治疗效率）', color: '#2ecc71' },
  ],
};

// 伤害数字显示
const DAMAGE_NUM_LIFE = 0.9;            // 数字存活秒数
const DAMAGE_NUM_SPEED = 40;            // 上升速度（像素/秒）

// ========== 副武器系统 ==========
const MAX_SECONDARY_WEAPONS = 3;        // 最多同时装备 3 个副武器

// 副武器池（按 id 描述静态参数）
const SECONDARY_WEAPON_POOL = {
  grenade_launcher: {
    id: 'grenade_launcher',
    name: '榴弹炮',
    desc: '5秒一发，对最近敌人造成基础攻击×800% 范围伤害（半径100px）',
    cooldown: 5.0,
    damageMult: 8.0,
    aoeRadius: 100,
    color: '#e67e22',
    type: 'aoe_direct',
  },
  grenade: {
    id: 'grenade',
    name: '手雷',
    desc: '10秒一发，自动丢向最近敌人脚下，2秒后爆炸，造成基础攻击×1500% 范围伤害（半径100px）',
    cooldown: 10.0,
    damageMult: 15.0,
    aoeRadius: 100,
    fuseTime: 2.0,
    color: '#e74c3c',
    type: 'aoe_delayed',
  },
  medkit: {
    id: 'medkit',
    name: '医疗包',
    desc: '8秒自动使用一次，恢复基础攻击×2000% 的生命值',
    cooldown: 8.0,
    damageMult: 20.0,
    color: '#2ecc71',
    type: 'heal',
  },
  orbital_cannon: {
    id: 'orbital_cannon',
    name: '天基屠龙炮',
    desc: '60秒冷却，每击杀敌人减少2秒CD。从轨道发射光束，对300px范围敌人造成攻击力×20的毁灭伤害',
    cooldown: 60.0,
    damageMult: 20.0,
    aoeRadius: 300,
    color: '#00d4ff',
    type: 'orbital',
    killReduceCd: 2.0,
  },
};

// 副武器列表（用于弹出选项时迭代）
const SECONDARY_WEAPON_LIST = [
  SECONDARY_WEAPON_POOL.grenade_launcher,
  SECONDARY_WEAPON_POOL.grenade,
  SECONDARY_WEAPON_POOL.medkit,
  SECONDARY_WEAPON_POOL.orbital_cannon,
];

// ========== 墙体系统 ==========
// 三种墙体类型：矮墙（绿色）| 中墙（灰色）| 高墙（暗蓝灰）
// 阻挡规则：
//   - 玩家/敌人移动：三种墙全部阻挡
//   - 手枪子弹（平射）：矮墙穿过，中墙/高墙阻挡
//   - 榴弹/手雷（抛射）：高墙阻挡，中墙/矮墙穿过
//   - 天基屠龙炮：无视所有墙体（空对地）
const WALL_TYPE = {
  LOW:  'low',   // 矮墙
  MID:  'mid',   // 中墙
  HIGH: 'high',  // 高墙
};

// 墙体颜色
const WALL_COLORS = {
  low:  '#6b8e4e',   // 浅绿灰（矮墙，灌木）
  mid:  '#9a9a9a',   // 亮灰（中墙，混凝土）
  high: '#5a5a8e',   // 蓝紫灰（高墙）
};

// 墙体是否阻挡平射子弹（矮墙不挡，中/高墙挡）
const WALL_BLOCKS_DIRECT = {
  low:  false,
  mid:  true,
  high: true,
};

// 墙体是否阻挡抛射物（只有高墙挡，矮/中墙不挡）
const WALL_BLOCKS_ARCING = {
  low:  false,
  mid:  false,
  high: true,
};

// ========== 角色定义 ==========
const HERO_POOL = {
  echo01: {
    id: 'echo01',
    name: 'Echo-01',
    title: '战术干员',
    avatar: 'E01',
    color: '#8a5cf0',
    portrait: 'pic/初始角色.png',
    desc: '精英战术干员，装备等离子冲锋枪，擅长高速连射与脉冲突袭。',
    stats: {
      maxHp: PLAYER_MAX_HP,
      attackBonus: 0,
      attackRange: PISTOL_RANGE,
      attackSpeedBonus: 0,
      bulletSpeed: BULLET_SPEED,
      critChance: 0,
    },
    primary: {
      type: 'triple',
      name: '等离子冲锋枪',
      burstInterval: 1.0,       // 三连发总冷却
      shotInterval: 0.12,       // 每发之间 0.12s
      damageMult: 0.4,          // 每发伤害 = 基础 × 0.4
      range: 260,
      bulletSpeed: 420,
      bulletColor: '#8a5cf0',   // 紫蓝色能量弹
      bulletCore: '#ffffff',
    },
    activeSkill: 'pulse_dash',
    passives: ['tactical_charge', 'field_reflex'],
  },
  standard: {
    id: 'standard',
    name: '标准干员',
    title: '新兵',
    avatar: 'STD',
    color: '#3498db',
    portrait: null,
    desc: '标准训练干员，装备单发手枪，稳定可靠。',
    stats: {
      maxHp: PLAYER_MAX_HP,
      attackBonus: 0,
      attackRange: PISTOL_RANGE,
      attackSpeedBonus: 0,
      bulletSpeed: BULLET_SPEED,
      critChance: 0,
    },
    primary: {
      type: 'single',
      name: '标准手枪',
      burstInterval: PISTOL_INTERVAL,
      damageMult: 1.0,
      range: PISTOL_RANGE,
      bulletSpeed: BULLET_SPEED,
      bulletColor: '#f1c40f',
      bulletCore: '#ffffff',
    },
    activeSkill: 'blink',
    passives: [],
  },
};

const HERO_LIST = [HERO_POOL.echo01, HERO_POOL.standard];

// ========== 主动技能系统 ==========
// 每个角色绑定一个专属技能，游戏开局直接装备
// 触发方式：手机点击右下角图标 / 电脑按 E 键
const ACTIVE_SKILL_POOL = {
  blink: {
    id: 'blink',
    name: '闪烁突袭',
    desc: '瞬间向移动方向瞬移 300px，落地对半径 50px 敌人造成伤害',
    cooldown: 10.0,
    blinkDist: 300,
    aoeRadius: 50,
    color: '#9b59b6',
    icon: '✦',
  },
  pulse_dash: {
    id: 'pulse_dash',
    name: '脉冲冲刺',
    desc: '向摇杆方向冲刺 180px，期间霸体；路径上敌人受到基础伤害 × 2 并被击退',
    cooldown: 6.0,
    dashDist: 180,
    invulnTime: 0.5,
    damageMult: 2.0,
    knockback: 40,
    color: '#8a5cf0',
    icon: '✦',
    isPulse: true,
  },
  dash: {
    id: 'dash',
    name: '冲刺翻滚',
    desc: '向摇杆方向快速冲刺 200px，期间霸体（免伤）0.3 秒',
    cooldown: 3.0,
    dashDist: 200,
    invulnTime: 0.3,
    color: '#3498db',
    icon: '➤',
  },
  haste: {
    id: 'haste',
    name: '疾跑',
    desc: '移速提升，持续 5 秒',
    cooldown: 5.0,
    duration: 5.0,
    speedMult: 1.6,
    color: '#2ecc71',
    icon: '»',
  },
};

const ACTIVE_SKILL_LIST = [
  ACTIVE_SKILL_POOL.blink,
  ACTIVE_SKILL_POOL.pulse_dash,
  ACTIVE_SKILL_POOL.dash,
  ACTIVE_SKILL_POOL.haste,
];
