// ========== 玩家 ==========
class Player {
  constructor() {
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.radius = PLAYER_RADIUS;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.speed = PLAYER_SPEED;
    this.vx = 0;
    this.vy = 0;
    // 武器
    this.attackCooldown = 0;
    this.attackRange = PISTOL_RANGE;
    this.attackDamage = PISTOL_DAMAGE;
    this.baseAttackInterval = PISTOL_INTERVAL;
    // 能力加成
    this.attackSpeedBonus = 0;
    this.critChance = 0;
    this.critMultiplier = CRIT_MULTIPLIER_BASE;
    this.attackInterval = this.baseAttackInterval * (100 / (100 + this.attackSpeedBonus));
    // 新增能力
    this.damageBonus = 0;           // 固定加值，基础攻击 +N
    this.viewRangeBonus = 0;         // 百分比，如 5 = +5%
    this.attackRangeBonus = 0;       // px，如 5 = 攻击范围 +5px
    this.pickupRangeBonus = 0;       // px，如 5 = 经验吸取范围 +5px
    this.expMultiplier = 1;           // 经验获取倍率（开发者面板可调）
    // 朝向（弧度）
    this.angle = 0;
    // 受击闪光
    this.damageFlash = 0;
    // 等级经验
    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_LEVEL_BASE;
    this.alive = true;
    // 升级挂起（用于外部检测暂停）
    this.pendingLevelUps = 0;
  }

  // 动态属性
  get effectiveAttackRange() { return PISTOL_RANGE + this.attackRangeBonus; }
  get effectivePickupRange() { return XP_PICKUP_RANGE + this.pickupRangeBonus; }
  // 视野 +5% → 世界内容缩小为 1/1.05，屏幕内能显示更多区域
  get viewRangeMultiplier() { return 1 / (1 + this.viewRangeBonus / 100); }
  get effectiveDamage() { return PISTOL_DAMAGE + this.damageBonus; }

  update(dt, bullets) {
    if (!this.alive) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(this.radius, Math.min(WORLD_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(WORLD_H - this.radius, this.y));
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    this.vx = 0;
    this.vy = 0;
  }

  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  canAttack() {
    return this.attackCooldown <= 0;
  }

  doAttack() {
    this.attackCooldown = this.attackInterval;
  }

  addXp(amount) {
    this.xp += amount * (this.expMultiplier || 1);
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.maxHp += 5;
      this.hp = Math.min(this.hp + 5, this.maxHp);
      this.xpToNext = this.level * XP_LEVEL_BASE;
      this.pendingLevelUps++;
      leveled = true;
    }
    return leveled;
  }

  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    this.damageFlash = DAMAGE_FLASH_DURATION;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  applyAbility(abilityId) {
    switch (abilityId) {
      case 'hp_max':
        this.maxHp += 10;
        this.hp = Math.min(this.hp + 10, this.maxHp);
        break;
      case 'attack_speed':
        this.attackSpeedBonus += 20;
        this.attackInterval = this.baseAttackInterval * (100 / (100 + this.attackSpeedBonus));
        break;
      case 'crit_chance':
        this.critChance += 10;
        break;
      case 'damage':
        this.damageBonus += 2;
        break;
      case 'view_range':
        this.viewRangeBonus += 5;
        break;
      case 'attack_range':
        this.attackRangeBonus += 5;
        break;
      case 'pickup_range':
        this.pickupRangeBonus += 5;
        break;
    }
  }

  rollAttack() {
    const roll = Math.random() * 100;
    const finalDmg = this.effectiveDamage;
    if (roll < this.critChance) {
      return { damage: finalDmg * this.critMultiplier, isCrit: true };
    }
    return { damage: finalDmg, isCrit: false };
  }
}
