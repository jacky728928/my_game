// ========== 玩家 ==========
class Player {
  constructor() {
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.radius = PLAYER_RADIUS;
    // 角色绑定（从 hero 页读取，默认 echo01）
    this.heroId = null;
    this.hero = null;
    this.hp = 0;
    this.maxHp = PLAYER_MAX_HP;
    this.baseAttackInterval = PISTOL_INTERVAL;
    this.speed = PLAYER_SPEED;
    this.vx = 0;
    this.vy = 0;
    // 武器
    this.attackCooldown = 0;
    // 三连发状态
    this.burstActive = false;
    this.burstShotsLeft = 0;
    this.burstShotTimer = 0;
    this.burstTotalShots = 1;
    this.burstShotInterval = 0.12;
    this.burstDamageMult = 1.0;
    this.bulletSpeed = BULLET_SPEED;
    this.bulletColor = '#f1c40f';
    this.bulletCore = '#ffffff';
    this.attackDamage = PISTOL_DAMAGE;
    this.attackRange = PISTOL_RANGE;
    // 能力加成
    this.attackSpeedBonus = 0;
    this.critChance = 0;
    this.critMultiplier = CRIT_MULTIPLIER_BASE;
    this.damageBonus = 0;
    this.viewRangeBonus = 0;
    this.attackRangeBonus = 0;
    this.pickupRangeBonus = 0;
    this.expMultiplier = 1;
    // 被动（默认初始化后由 _bindHero() 覆盖 enabled
    this.tacticalCharge = {
      enabled: false,
      roundsCompleted: 0,
      stacks: 0,
      maxStacks: 3,
      roundsPerStack: 1,
      damageBonusMult: 0.8,
      stunTime: 0.3,
      pendingBuff: false,
    };
    this.fieldReflex = {
      enabled: false,
      hpThreshold: 0.3,
      speedBonus: 20,
      attackSpeedBonus: 15,
      active: false,
    };
    this.secondaryWeapons = [];
    this.secondaryAbilityLevels = {};
    this.activeSkillId = null;
    this.activeSkillCooldown = 0;
    this.activeSkillBuff = null;
    this.angle = 0;
    this.damageFlash = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_LEVEL_BASE;
    this.alive = true;
    this.pendingLevelUps = [];
    this._stunFlash = 0;
    // 角色绑定（必须在所有字段初始化后调用，因为它覆盖部分字段并读写被动.enabled
    this._bindHero();
    this.hp = this.maxHp;
    this.attackInterval = this.baseAttackInterval * (100 / (100 + this.attackSpeedBonus));
  }

  _bindHero() {
    let heroId = 'echo01';
    try {
      const saved = localStorage.getItem('hero_selected_id');
      if (saved && typeof HERO_POOL !== 'undefined' && HERO_POOL[saved]) heroId = saved;
    } catch (e) {}
    if (typeof HERO_POOL === 'undefined' || !HERO_POOL[heroId]) heroId = 'echo01';
    this.heroId = heroId;
    const hero = HERO_POOL[heroId];
    this.hero = hero;
    this.maxHp = hero.stats.maxHp;
    this.baseAttackInterval = hero.primary.burstInterval;
    this.attackRange = hero.primary.range;
    this.attackDamage = PISTOL_DAMAGE + hero.stats.attackBonus;
    this.burstTotalShots = (hero.primary.type === 'triple') ? 3 : 1;
    this.burstShotInterval = hero.primary.shotInterval || 0.12;
    this.burstDamageMult = hero.primary.damageMult || 1.0;
    this.bulletSpeed = hero.primary.bulletSpeed || BULLET_SPEED;
    this.bulletColor = hero.primary.bulletColor || '#f1c40f';
    this.bulletCore = hero.primary.bulletCore || '#ffffff';
    this.activeSkillId = hero.activeSkill || null;
    const passives = hero.passives || [];
    if (this.tacticalCharge) this.tacticalCharge.enabled = passives.indexOf('tactical_charge') !== -1;
    if (this.fieldReflex) this.fieldReflex.enabled = passives.indexOf('field_reflex') !== -1;
    if (window.LOG) {
      window.LOG('player: 绑定角色 = ' + heroId + ' (' + hero.name + ')，主武器=' + hero.primary.name + '，连发=' + this.burstTotalShots + '发，主动技能=' + (this.activeSkillId || '无') + '，被动=[' + passives.join(', ') + ']');
    }
  }

  get effectiveAttackRange() { return (this.hero ? this.hero.stats.attackRange : PISTOL_RANGE) + this.attackRangeBonus; }
  get effectivePickupRange() { return XP_PICKUP_RANGE + this.pickupRangeBonus; }
  get viewRangeMultiplier() { return 1 / (1 + this.viewRangeBonus / 100); }
  get effectiveDamage() { return PISTOL_DAMAGE + this.damageBonus + (this.hero ? this.hero.stats.attackBonus : 0); }

  update(dt, bullets) {
    if (!this.alive) return;
    let curSpeed = this.speed;
    if (this.activeSkillBuff && this.activeSkillBuff.id === 'haste' && this.activeSkillBuff.timeLeft > 0) {
      curSpeed = this.speed * this.activeSkillBuff.speedMult;
    }
    // 战场反应：HP < 30% 时额外加速
    if (this.fieldReflex.enabled) {
      const ratio = this.hp / this.maxHp;
      if (ratio < this.fieldReflex.hpThreshold) {
        curSpeed *= (1 + this.fieldReflex.speedBonus / 100);
        if (!this.fieldReflex.active) {
          this.fieldReflex.active = true;
          this._refreshAttackInterval();
        }
      } else if (this.fieldReflex.active) {
        this.fieldReflex.active = false;
        this._refreshAttackInterval();
      }
    }
    const oldX = this.x;
    const oldY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      const vMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (vMag > 0) {
        this.vx = this.vx / vMag * curSpeed;
        this.vy = this.vy / vMag * curSpeed;
      }
    }
    const resolved = resolveCircleWalls(oldX, oldY, this.radius, this.x, this.y);
    this.x = resolved.x;
    this.y = resolved.y;
    this.x = Math.max(this.radius, Math.min(WORLD_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(WORLD_H - this.radius, this.y));
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    // 三连发：每 burstShotInterval 发射一发
    if (this.burstActive) {
      this.burstShotTimer -= dt;
      if (this.burstShotTimer <= 0 && this.burstShotsLeft > 0) {
        // 发射下一发（由 combat.js 监听 burstActive+shotTimer 触发；这里只维护状态）
        // 实际由 combat.update() 调用 fireBurstShot()
      }
    }
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
    this._stunFlash = Math.max(0, this._stunFlash - dt);
    this.vx = 0;
    this.vy = 0;
  }

  _refreshAttackInterval() {
    let bonus = this.attackSpeedBonus;
    if (this.fieldReflex.enabled && this.fieldReflex.active) {
      bonus += this.fieldReflex.attackSpeedBonus;
    }
    this.attackInterval = this.baseAttackInterval * (100 / (100 + bonus));
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

  // 开启三连发（由 combat.js 调用）
  startBurst() {
    if (this.burstTotalShots > 1) {
      this.burstActive = true;
      this.burstShotsLeft = this.burstTotalShots;
      this.burstShotTimer = 0; // 立即发第一发
    } else {
      this.burstActive = false;
      this.burstShotsLeft = 0;
    }
  }

  // 三连发中发射了一发，返回是否"当前这发"需要应用战术充能加成
  consumeBurstShot() {
    if (!this.burstActive || this.burstShotsLeft <= 0) return { isFirst: false, chargeStacks: 0 };
    const totalShots = this.burstTotalShots;
    const isFirst = (this.burstShotsLeft === totalShots);
    let chargeStacks = 0;
    if (this.tacticalCharge.enabled && isFirst && this.tacticalCharge.pendingBuff) {
      chargeStacks = this.tacticalCharge.stacks;
      // 消耗一层
      this.tacticalCharge.stacks = Math.max(0, this.tacticalCharge.stacks - 1);
      if (this.tacticalCharge.stacks <= 0) {
        this.tacticalCharge.pendingBuff = false;
      }
    }
    this.burstShotsLeft -= 1;
    if (this.burstShotsLeft <= 0) {
      this.burstActive = false;
      // 完成一轮三连发 → 计数充能
      if (this.tacticalCharge.enabled && totalShots > 1) {
        this.tacticalCharge.roundsCompleted += 1;
        if (this.tacticalCharge.roundsCompleted >= this.tacticalCharge.roundsPerStack) {
          this.tacticalCharge.roundsCompleted = 0;
          if (this.tacticalCharge.stacks < this.tacticalCharge.maxStacks) {
            this.tacticalCharge.stacks += 1;
            this.tacticalCharge.pendingBuff = true;
            if (window.LOG) window.LOG('player: [战术充能] 获得一层充能！当前层数=' + this.tacticalCharge.stacks + '/' + this.tacticalCharge.maxStacks);
          }
        }
      }
    }
    return { isFirst: isFirst, chargeStacks: chargeStacks };
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
      const isSecondary = this.level === 5 || (this.level >= 10 && this.level % 10 === 0);
      this.pendingLevelUps.push({ level: this.level, type: isSecondary ? 'secondary' : 'ability' });
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
        this._refreshAttackInterval();
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
        this.secondaryAbilityLevels[abilityId] = (this.secondaryAbilityLevels[abilityId] || 0) + 1;
        break;
    }
  }

  // 计算单次射击的最终伤害（基于 roll 且含战术充能）
  rollAttack(chargeStacks) {
    const roll = Math.random() * 100;
    const baseDmg = this.effectiveDamage;
    let dmg = baseDmg;
    if (chargeStacks && chargeStacks > 0) {
      dmg = baseDmg * (1 + this.tacticalCharge.damageBonusMult);
      if (window.LOG) window.LOG('player: [战术充能·首发] 伤害 ' + dmg.toFixed(2) + '（基础 ' + baseDmg.toFixed(2) + '）');
    }
    if (roll < this.critChance) {
      return { damage: dmg * this.critMultiplier, isCrit: true, hasCharge: chargeStacks > 0 };
    }
    return { damage: dmg, isCrit: false, hasCharge: chargeStacks > 0 };
  }

  hasSecondaryWeapon(id) {
    return this.secondaryWeapons.some(w => w.id === id);
  }

  equipSecondaryWeapon(id) {
    if (!SECONDARY_WEAPON_POOL[id]) return;
    if (this.hasSecondaryWeapon(id)) return;
    const def = SECONDARY_WEAPON_POOL[id];
    this.secondaryWeapons.push({
      id: def.id,
      def: def,
      cooldown: 0,
    });
  }

  discardSecondaryWeapon(id) {
    this.secondaryWeapons = this.secondaryWeapons.filter(w => w.id !== id);
  }

  equipActiveSkill(id) {
    if (!ACTIVE_SKILL_POOL[id]) return;
    this.activeSkillId = id;
    this.activeSkillCooldown = 0;
    this.activeSkillBuff = null;
  }

  releaseActiveSkill() {
    if (!this.activeSkillId) return false;
    if (this.activeSkillCooldown > 0) return false;
    const def = ACTIVE_SKILL_POOL[this.activeSkillId];
    if (!def) return false;
    this.activeSkillCooldown = def.cooldown;
    return true;
  }

  isInvulnerable() {
    if (this._invulnTimeLeft && this._invulnTimeLeft > 0) return true;
    return false;
  }

  startInvuln(seconds) {
    this._invulnTimeLeft = seconds;
  }

  flashStun(time) {
    this._stunFlash = time || 0.2;
  }
}
