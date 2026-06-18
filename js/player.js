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
    // 副武器槽：最多 MAX_SECONDARY_WEAPONS 个
    this.secondaryWeapons = [];       // [{ id, cooldown, ...静态参数引用 }]
    // 副武器专属技能等级
    this.secondaryAbilityLevels = {}; // { weaponId: { abilityId: level } }
    // 主动技能
    this.activeSkillId = null;         // 已装备的主动技能 id
    this.activeSkillCooldown = 0;      // 冷却剩余（秒）
    this.activeSkillBuff = null;       // 当前 buff：{ id, timeLeft, speedMult }
    // 朝向（弧度）
    this.angle = 0;
    // 受击闪光
    this.damageFlash = 0;
    // 等级经验
    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_LEVEL_BASE;
    this.alive = true;
    // 升级挂起（数组，每项记录升级后得到的等级和类型）
    this.pendingLevelUps = [];
  }

  // 动态属性
  get effectiveAttackRange() { return PISTOL_RANGE + this.attackRangeBonus; }
  get effectivePickupRange() { return XP_PICKUP_RANGE + this.pickupRangeBonus; }
  // 视野 +5% → 世界内容缩小为 1/1.05，屏幕内能显示更多区域
  get viewRangeMultiplier() { return 1 / (1 + this.viewRangeBonus / 100); }
  get effectiveDamage() { return PISTOL_DAMAGE + this.damageBonus; }

  update(dt, bullets) {
    if (!this.alive) return;
    // 计算实际速度（带疾跑加成）
    let curSpeed = this.speed;
    if (this.activeSkillBuff && this.activeSkillBuff.id === 'haste' && this.activeSkillBuff.timeLeft > 0) {
      curSpeed = this.speed * this.activeSkillBuff.speedMult;
    }
    const oldX = this.x;
    const oldY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // 限制 vx/vy 用 curSpeed 的倍率 — 重新设置为当前输入方向 × 实际速度
    // （外层 setVelocity 使用 this.speed 作为基准，这里二次调整）
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      const vMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (vMag > 0) {
        this.vx = this.vx / vMag * curSpeed;
        this.vy = this.vy / vMag * curSpeed;
      }
    }
    // 墙体碰撞修正
    const resolved = resolveCircleWalls(oldX, oldY, this.radius, this.x, this.y);
    this.x = resolved.x;
    this.y = resolved.y;
    this.x = Math.max(this.radius, Math.min(WORLD_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(WORLD_H - this.radius, this.y));
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.activeSkillCooldown = Math.max(0, this.activeSkillCooldown - dt);
    if (this.activeSkillBuff) {
      this.activeSkillBuff.timeLeft -= dt;
      if (this.activeSkillBuff.timeLeft <= 0) this.activeSkillBuff = null;
    }
    if (this._invulnTimeLeft && this._invulnTimeLeft > 0) {
      this._invulnTimeLeft -= dt;
      if (this._invulnTimeLeft <= 0) this._invulnTimeLeft = 0;
    }
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
      // 判断本等级的类型
      const isSecondary =
        this.level === 5 ||
        (this.level >= 10 && this.level % 10 === 0);
      this.pendingLevelUps.push({
        level: this.level,
        type: isSecondary ? 'secondary' : 'ability',
      });
      leveled = true;
    }
    return leveled;
  }

  takeDamage(dmg) {
    if (this.isInvulnerable()) return;
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
        this.viewRangeBonus += 25;
        break;
      case 'attack_range':
        this.attackRangeBonus += 25;
        break;
      case 'pickup_range':
        this.pickupRangeBonus += 25;
        break;
      default:
        // 副武器专属技能：按完整 abilityId 累加等级（flat map，避免下划线拆分问题）
        this.secondaryAbilityLevels[abilityId] =
          (this.secondaryAbilityLevels[abilityId] || 0) + 1;
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

  // 副武器：是否已装备同名
  hasSecondaryWeapon(id) {
    return this.secondaryWeapons.some(w => w.id === id);
  }

  // 副武器：装备（调用方确保数量合法）
  equipSecondaryWeapon(id) {
    if (!SECONDARY_WEAPON_POOL[id]) return;
    if (this.hasSecondaryWeapon(id)) return;
    const def = SECONDARY_WEAPON_POOL[id];
    this.secondaryWeapons.push({
      id: def.id,
      def: def,
      cooldown: 0,              // 装备后立即可触发
    });
  }

  // 副武器：丢弃
  discardSecondaryWeapon(id) {
    this.secondaryWeapons = this.secondaryWeapons.filter(w => w.id !== id);
  }

  // 主动技能：装备
  equipActiveSkill(id) {
    if (!ACTIVE_SKILL_POOL[id]) return;
    this.activeSkillId = id;
    this.activeSkillCooldown = 0;
    this.activeSkillBuff = null;
  }

  // 主动技能：释放（返回是否成功释放，调用方处理具体效果）
  releaseActiveSkill() {
    if (!this.activeSkillId) return false;
    if (this.activeSkillCooldown > 0) return false;
    const def = ACTIVE_SKILL_POOL[this.activeSkillId];
    if (!def) return false;
    this.activeSkillCooldown = def.cooldown;
    return true;
  }

  // 是否处于免伤/霸体状态
  isInvulnerable() {
    if (this._invulnTimeLeft && this._invulnTimeLeft > 0) return true;
    return false;
  }

  // 开启霸体（冲刺翻滚用）
  startInvuln(seconds) {
    this._invulnTimeLeft = seconds;
  }
}
