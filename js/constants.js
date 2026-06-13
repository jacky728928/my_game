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
const PISTOL_INTERVAL = 0.2;    // 攻击间隔(秒)
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
