// ========== 游戏常量 ==========
const WORLD_W = 2400;
const WORLD_H = 2400;

// 玩家
const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 180;        // 像素/秒
const PLAYER_MAX_HP = 100;

// 武器
const PISTOL_RANGE = 250;        // 攻击范围半径
const PISTOL_DAMAGE = 5;
const PISTOL_INTERVAL = 1.0;    // 攻击间隔(秒)
const BULLET_SPEED = 400;
const BULLET_RADIUS = 4;

// 敌人 - 6级预设 (HP=等级×10, 随机移速)
const ENEMY_TIERS = [
  { level: 1, hp: 10,  size: 22, speedMin: 100, speedMax: 155, color: '#e74c3c', glow: '#f1948a' },
  { level: 2, hp: 20,  size: 26, speedMin:  90, speedMax: 145, color: '#e67e22', glow: '#f0b27a' },
  { level: 3, hp: 30,  size: 30, speedMin:  80, speedMax: 135, color: '#f1c40f', glow: '#f9e054' },
  { level: 4, hp: 40,  size: 34, speedMin:  70, speedMax: 125, color: '#2ecc71', glow: '#82e0aa' },
  { level: 5, hp: 50,  size: 38, speedMin:  60, speedMax: 115, color: '#3498db', glow: '#85c1e9' },
  { level: 6, hp: 60,  size: 42, speedMin:  50, speedMax: 105, color: '#9b59b6', glow: '#c39bd3' },
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
  { id: 'view_range',    name: '鹰眼视野', desc: '视野范围 +5%（显示更大区域）' },
  { id: 'attack_range',  name: '超距感知', desc: '攻击范围 +5 px' },
  { id: 'pickup_range',  name: '灵力汲取', desc: '经验吸取范围 +5 px' },
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
};

// 副武器列表（用于弹出选项时迭代）
const SECONDARY_WEAPON_LIST = [
  SECONDARY_WEAPON_POOL.grenade_launcher,
  SECONDARY_WEAPON_POOL.grenade,
  SECONDARY_WEAPON_POOL.medkit,
];
