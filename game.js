const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WORLD_SIZE = 5600;
const HALF_WORLD = WORLD_SIZE / 2;
const LAKE_RADIUS = 420;
const RESOURCE_NODE_HP = 120;
const RESOURCE_GATHER_DAMAGE = 40;
const RESOURCE_LIMITS = { wood: 60, stone: 30, gold: 10 };
const RESOURCE_DROP_RATE = { wood: 0.6, stone: 0.3, gold: 0.1 };
const SPAWN_SAFE_RADIUS = 540;
const CAMERA_ZOOM = 1.35;
const SELL_VALUES = { wood: 1, stone: 2 };

const keys = {};
const mouse = { x: 0, y: 0 };
let playerName = "Unknown";
let running = false;
let lastTimestamp = 0;
let battleLog = [];
let gameOverMessageUntil = 0;
const uiVisibility = { hud: true, leaderboard: true, battleLog: true, minimap: true, recap: true };

const SHARPNESS = [
    { name: "Blond", multiplier: 1.0, chance: 0.6 },
    { name: "Sharp", multiplier: 1.3, chance: 0.225 },
    { name: "Edgy", multiplier: 1.75, chance: 0.125 },
    { name: "Master", multiplier: 2.0, chance: 0.05 }
];
const WEAPON_TIERS = { gold: 1.1, diamond: 1.25, ruby: 1.5, emerald: 2, divine: 2.5, blue: 3 };
const WEAPON_DATA = {
    shovel: { name: "Shovel", dmg: 5, range: 2.2, atkSpeed: 1.5, gatherOnly: true },
    dagger: { name: "Dagger", dmg: 10, range: 2.0, atkSpeed: 0.7 },
    sword: { name: "Sword", dmg: 15, range: 4.0, atkSpeed: 0.9 },
    longSword: { name: "Long Sword", dmg: 20, range: 6.5, atkSpeed: 1.0 },
    spear: { name: "Spear", dmg: 15, range: 8.0, atkSpeed: 1.5, returnCooldown: 6 },
    axe: { name: "Axe", dmg: 30, range: 3.5, atkSpeed: 2.0 }
};
const CRAFT_RECIPES = {
    dagger: { wood: 50, stone: 15 },
    sword: { wood: 75, stone: 25 },
    longSword: { wood: 50, stone: 50 },
    spear: { wood: 75, stone: 25 },
    axe: { wood: 50, stone: 80 }
};
const ARMOR_RECIPES = {
    lightHelmet: { stone: 100, level: 3 },
    lightWings: { stone: 150, level: 3 },
    mediumHelmet: { stone: 225, level: 5 },
    mediumWings: { stone: 300, level: 5 },
    heavyHelmet: { stone: 550, level: 8 },
    heavyWings: { stone: 900, level: 8 }
};
const ARMOR_DATA = {
    lightHelmet: { def: 10, speedMult: 1.25 },
    lightWings: { def: 15, speedMult: 1.25 },
    mediumHelmet: { def: 25, speedMult: 1.0 },
    mediumWings: { def: 35, speedMult: 1.0 },
    heavyHelmet: { def: 60, speedMult: 0.66 },
    heavyWings: { def: 80, speedMult: 0.66 }
};
const ARMOR_TIERS = ["rusty", "stabil", "bulletProof", "master", "gold", "diamond", "ruby", "emerald", "divine", "goat"];
const SKILL_DATA = {
    shockWave: { cd: 80, range: 6, damage: 10 },
    fireShot: { cd: 120, range: 14, damage: 40, burnDmg: 5, burnTick: 3 },
    targetMagnet: { cd: 150, range: 20, damage: 0 },
    berserker: { cd: 180, duration: 5 }
};

const TEXTURE_KEYS = {
    grass: "textures/terrain/grass_tile.png",
    dirt: "textures/terrain/dirt_tile.png",
    stone: "textures/terrain/stone_tile.png",
    lake: "textures/terrain/lake_water_tile.png",
    woodNode: "textures/resources/tree_node.png",
    stoneNode: "textures/resources/stone_node.png",
    goldNode: "textures/resources/gold_node.png",
    player: "textures/player/player_idle.png",
    playerBerserk: "textures/player/player_berserk.png",
    raider: "textures/enemies/raider.png",
    bossP1: "textures/enemies/elite_boss_phase1.png",
    bossP2: "textures/enemies/elite_boss_phase2.png",
    weaponShovel: "textures/weapons/shovel.png",
    weaponDagger: "textures/weapons/dagger.png",
    weaponSword: "textures/weapons/sword.png",
    weaponLongSword: "textures/weapons/long_sword.png",
    weaponSpear: "textures/weapons/spear.png",
    weaponAxe: "textures/weapons/axe.png",
    fireShot: "textures/vfx/fire_shot.png",
    shockWave: "textures/vfx/shock_wave_ring.png",
    hudPanel: "textures/ui/hud_panel.png",
    minimapFrame: "textures/ui/minimap_frame.png"
};

const textures = {};
function preloadTextures() {
    for (const [key, src] of Object.entries(TEXTURE_KEYS)) {
        const img = new Image();
        img.src = src;
        textures[key] = { img, loaded: false };
        img.onload = () => { textures[key].loaded = true; };
        img.onerror = () => { textures[key].loaded = false; };
    }
}

const state = {
    leaderboard: JSON.parse(localStorage.getItem("crimsonLeaderboard") || "[]"),
    score: 0,
    entities: [],
    resources: [],
    projectiles: [],
    effects: [],
    bosses: [],
    clans: [],
    spawnTimer: 0,
    bossSpawnTimer: 14,
    floatingText: [],
    deathRecap: [],
    worldSeed: 1,
    craftUi: { open: false, buttons: [], toggleButton: null }
};

const player = createPlayer();
function createPlayer() {
    return {
        x: 0, y: 0, radius: 18, level: 1, xp: 0, hp: 105, maxHp: 105, baseAtk: 5, speed: 10, def: 2, angle: 0,
        weapons: [{ id: "shovel", sharpness: SHARPNESS[0], tier: "gold" }, { id: "dagger", sharpness: SHARPNESS[0], tier: "gold" }],
        activeWeapon: 0, attackCooldown: 0, dashCooldown: 0, spearReturnTimer: 0,
        inventory: { wood: 0, stone: 0, gold: 0, ultimateEssence: 0, token: 0 },
        armor: { helmet: null, wings: null, tierIndex: 0 },
        buffs: { berserkerUntil: 0, spawnProtectionUntil: 0 },
        skillCd: { shockWave: 0, fireShot: 0, targetMagnet: 0, berserker: 0 },
        clanId: null, bleedUntil: 0, lastCombatAt: 0,
        swingUntil: 0,
        swingDirection: 1
    };
}

function getLevelRequirement(level) {
    return level * 100;
}

function computeStats(entity, nowSec) {
    const berserk = nowSec < entity.buffs?.berserkerUntil;
    const hpFromLevel = 100 + 5 * entity.level;
    const defFromLevel = 1 + entity.level;
    const armorDef = (entity.armor?.helmet ? ARMOR_DATA[entity.armor.helmet].def : 0) + (entity.armor?.wings ? ARMOR_DATA[entity.armor.wings].def : 0);
    const armorSpeedMult = (entity.armor?.helmet ? ARMOR_DATA[entity.armor.helmet].speedMult : 1) * (entity.armor?.wings ? ARMOR_DATA[entity.armor.wings].speedMult : 1);
    const atk = entity.baseAtk * (berserk ? 1.3 : 1);
    const def = (defFromLevel + armorDef) * (berserk ? 1.3 : 1);
    const speed = entity.speed * armorSpeedMult * (berserk ? 1.3 : 1);
    const maxHp = hpFromLevel * (berserk ? 1.3 : 1);
    return { atk, def, speed, maxHp };
}

function addLog(text) {
    battleLog.unshift(text);
    battleLog = battleLog.slice(0, 9);
}

function getCurrentWeapon() {
    return player.weapons[player.activeWeapon];
}

function getCraftableWeaponCount() {
    return player.weapons.filter((w) => w.id !== "shovel").length;
}

function getWeaponBySlot(slotNumber) {
    const shovel = player.weapons.find((w) => w.id === "shovel");
    const combat = player.weapons.filter((w) => w.id !== "shovel");
    if (slotNumber === 1) return shovel || null;
    if (slotNumber === 2) return combat[0] || null;
    if (slotNumber === 3) return combat[1] || null;
    return null;
}

function equipWeaponSlot(slotNumber) {
    const weapon = getWeaponBySlot(slotNumber);
    if (!weapon) {
        addLog(`Slot ${slotNumber} is empty`);
        return;
    }
    const index = player.weapons.findIndex((w) => w === weapon);
    if (index >= 0) player.activeWeapon = index;
}

function getWeaponDamage(weapon, attackBonus = 1) {
    const base = WEAPON_DATA[weapon.id].dmg;
    const sharpness = weapon.sharpness.multiplier;
    const tier = WEAPON_TIERS[weapon.tier] || 1;
    return base * sharpness * tier * attackBonus;
}

function getWeaponTextureKey(weaponId) {
    const mapping = {
        shovel: "weaponShovel",
        dagger: "weaponDagger",
        sword: "weaponSword",
        longSword: "weaponLongSword",
        spear: "weaponSpear",
        axe: "weaponAxe"
    };
    return mapping[weaponId];
}

function clampToWorld(entity) {
    entity.x = Math.max(-HALF_WORLD, Math.min(HALF_WORLD, entity.x));
    entity.y = Math.max(-HALF_WORLD, Math.min(HALF_WORLD, entity.y));
}

function randIn(min, max) {
    return Math.random() * (max - min) + min;
}

function pickWeightedSharpness() {
    let roll = Math.random();
    for (const s of SHARPNESS) {
        roll -= s.chance;
        if (roll <= 0) return s;
    }
    return SHARPNESS[0];
}

function spawnFloatingText(x, y, text, color = "#ffffff") {
    state.floatingText.push({ x, y, text, color, ttl: 1.0 });
}

function registerDamage(source, amount, nowSec) {
    const line = `${source} -${amount.toFixed(1)}`;
    state.deathRecap.unshift(line);
    state.deathRecap = state.deathRecap.slice(0, 5);
    player.lastCombatAt = nowSec;
    addLog(line);
}

function zonePoint(type) {
    let x = 0;
    let y = 0;
    const angle = randIn(0, Math.PI * 2);
    if (type === "gold") {
        const radius = randIn(40, LAKE_RADIUS - 20);
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
    } else if (type === "stone") {
        const radius = randIn(LAKE_RADIUS + 250, LAKE_RADIUS + 1200);
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
    } else {
        const radius = randIn(LAKE_RADIUS + 900, HALF_WORLD - 80);
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
    }
    return { x, y };
}

function hasNearbyNode(x, y, minDist) {
    return state.resources.some((n) => Math.hypot(n.x - x, n.y - y) < minDist);
}

function generateResource(type) {
    let x = randIn(-HALF_WORLD, HALF_WORLD);
    let y = randIn(-HALF_WORLD, HALF_WORLD);
    if (type === "gold") {
        const p = zonePoint(type);
        x = p.x;
        y = p.y;
    } else {
        for (let i = 0; i < 20; i += 1) {
            const p = zonePoint(type);
            x = p.x;
            y = p.y;
            if (!hasNearbyNode(x, y, 42) && Math.hypot(x - player.x, y - player.y) > 180) break;
        }
    }
    return { type, x, y, hp: RESOURCE_NODE_HP, radius: 18 };
}

function ensureResourcePopulation() {
    const counts = { wood: 0, stone: 0, gold: 0 };
    for (const node of state.resources) counts[node.type] += 1;
    for (const type of Object.keys(RESOURCE_LIMITS)) {
        while (counts[type] < RESOURCE_LIMITS[type]) {
            state.resources.push(generateResource(type));
            counts[type] += 1;
        }
    }
}

function ensureStarterResources() {
    const nearPlayer = state.resources.filter((n) => Math.hypot(n.x - player.x, n.y - player.y) < 320);
    const woodNear = nearPlayer.filter((n) => n.type === "wood").length;
    const stoneNear = nearPlayer.filter((n) => n.type === "stone").length;
    if (woodNear < 3) {
        for (let i = woodNear; i < 3; i += 1) {
            state.resources.push({ type: "wood", x: player.x + randIn(-220, 220), y: player.y + randIn(-220, 220), hp: RESOURCE_NODE_HP, radius: 18 });
        }
    }
    if (stoneNear < 2) {
        for (let i = stoneNear; i < 2; i += 1) {
            state.resources.push({ type: "stone", x: player.x + randIn(-240, 240), y: player.y + randIn(-240, 240), hp: RESOURCE_NODE_HP, radius: 18 });
        }
    }
}

function spawnEnemy(type = "raider", nowSec = performance.now() / 1000) {
    const p = HALF_WORLD - 120;
    let x = 0;
    let y = 0;
    for (let i = 0; i < 30; i += 1) {
        const side = Math.floor(Math.random() * 4);
        x = side === 0 ? -p : side === 1 ? p : randIn(-p, p);
        y = side === 2 ? -p : side === 3 ? p : randIn(-p, p);
        if (Math.hypot(x - player.x, y - player.y) > SPAWN_SAFE_RADIUS) break;
    }
    const e = {
        id: crypto.randomUUID(),
        type,
        x,
        y,
        radius: type === "boss" ? 32 : 16,
        level: type === "boss" ? Math.max(4, player.level + 1) : Math.max(1, player.level - 1 + Math.floor(Math.random() * 2)),
        hp: type === "boss" ? randIn(1200, 1500) : 90 + Math.random() * 40,
        maxHp: type === "boss" ? 1500 : 130,
        speed: type === "boss" ? 4.6 : 7.1,
        baseAtk: type === "boss" ? 15 : 4.2,
        def: type === "boss" ? 14 : 2,
        attackCooldown: 0,
        burnUntil: 0,
        burnTickAt: 0,
        bossPhase: 1,
        bossStateTimer: 0,
        telegraphUntil: 0,
        queuedAction: null,
        lastDamager: null,
        damageMap: {},
        clanId: null
    };
    if (type === "boss") addLog("Elite boss spawned far from player");
    if (type === "boss") state.bosses.push(e);
    else state.entities.push(e);
}

function damageTarget(target, amount, source, nowSec) {
    target.hp -= amount;
    spawnFloatingText(target.x, target.y - 20, `-${Math.round(amount)}`, "#ffcf70");
    if (target.type === "boss" && source === "player") {
        target.damageMap.player = (target.damageMap.player || 0) + amount;
    }
    if (target.hp <= 0) {
        if (target.type === "boss") {
            const dealt = target.damageMap.player || 0;
            const percent = Math.max(0, Math.min(1, dealt / target.maxHp));
            const xp = percent * 100;
            gainXp(xp);
            player.inventory.gold += 75;
            player.inventory.ultimateEssence += 1;
            state.score += percent * 100 + player.level;
            addLog("Elite Boss defeated: +Ultimate Essence +Gold +XP");
            state.bosses = state.bosses.filter((b) => b.id !== target.id);
            return;
        }
        if (source === "player") {
            state.score += target.level * 1.5;
            gainXp(20 + target.level * 3);
            player.inventory.gold += 6;
        }
        state.entities = state.entities.filter((e) => e.id !== target.id);
    }
}

function gainXp(amount) {
    player.xp += amount;
    while (player.xp >= getLevelRequirement(player.level)) {
        player.xp -= getLevelRequirement(player.level);
        player.level += 1;
        const stats = computeStats(player, performance.now() / 1000);
        player.maxHp = stats.maxHp;
        player.hp = player.maxHp;
        addLog(`Level up: ${player.level}`);
    }
}

function attack(nowSec) {
    const equipped = getCurrentWeapon();
    if (!equipped) return;
    const data = WEAPON_DATA[equipped.id];
    if (player.attackCooldown > nowSec) return;
    if (equipped.id === "spear" && player.spearReturnTimer > nowSec) return;
    player.attackCooldown = nowSec + data.atkSpeed;
    if (equipped.id === "spear") player.spearReturnTimer = nowSec + data.returnCooldown;
    player.swingUntil = nowSec + 0.16;
    player.swingDirection *= -1;

    const stats = computeStats(player, nowSec);
    const damage = getWeaponDamage(equipped, stats.atk / 5);
    const rangePx = data.range * 32;
    state.effects.push({
        type: "hitArc",
        x: player.x,
        y: player.y,
        angle: player.angle,
        range: rangePx,
        until: nowSec + 0.08
    });

    let hitEntity = false;
    const allTargets = [...state.entities, ...state.bosses];
    for (const enemy of allTargets) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= rangePx + enemy.radius) {
            damageTarget(enemy, damage, "player", nowSec);
            hitEntity = true;
        }
    }

    if (equipped.id === "shovel") {
        let gatheredAny = false;
        for (const node of [...state.resources]) {
            const dist = Math.hypot(node.x - player.x, node.y - player.y);
            if (dist <= rangePx + node.radius) {
                node.hp -= RESOURCE_GATHER_DAMAGE;
                gatheredAny = true;
                player.inventory[node.type] += 1;
                spawnFloatingText(node.x, node.y - 28, `+1 ${node.type}`, "#7CFFB8");
                if (node.hp <= 0) {
                    const resType = node.type;
                    const quantity = Math.round(40 * RESOURCE_DROP_RATE[resType]);
                    player.inventory[resType] += quantity;
                    gainXp(resType === "gold" ? 10 : 5);
                    state.resources = state.resources.filter((n) => n !== node);
                    addLog(`Gathered ${resType} +${quantity}`);
                }
            }
        }
        if (!gatheredAny) addLog("No resource in shovel range");
    }
    if (equipped.id !== "shovel" && state.resources.some((node) => Math.hypot(node.x - player.x, node.y - player.y) <= rangePx + node.radius)) {
        addLog("Equip shovel to gather resources");
    }
    if (hitEntity) addLog(`${WEAPON_DATA[equipped.id].name} hit`);
}

function castShockWave(nowSec) {
    if (player.skillCd.shockWave > nowSec) return;
    player.skillCd.shockWave = nowSec + SKILL_DATA.shockWave.cd;
    const rangePx = SKILL_DATA.shockWave.range * 32;
    const damage = SKILL_DATA.shockWave.damage + player.level * 0.9;
    state.effects.push({
        type: "shockWave",
        x: player.x,
        y: player.y,
        radius: 0,
        maxRadius: rangePx,
        until: nowSec + 0.45
    });
    for (const enemy of state.entities) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= rangePx) damageTarget(enemy, damage, "player", nowSec);
    }
    addLog("Shock Wave activated");
}

function castFireShot(nowSec) {
    if (player.skillCd.fireShot > nowSec) return;
    player.skillCd.fireShot = nowSec + SKILL_DATA.fireShot.cd;
    const rangePx = SKILL_DATA.fireShot.range * 32;
    const angle = player.angle;
    state.projectiles.push({
        type: "fire",
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 320,
        vy: Math.sin(angle) * 320,
        life: nowSec + 1.4,
        rangePx,
        damage: SKILL_DATA.fireShot.damage + player.level * 1.2
    });
    addLog("Fire Shot casted");
}

function castTargetMagnet(nowSec) {
    if (player.skillCd.targetMagnet > nowSec) return;
    player.skillCd.targetMagnet = nowSec + SKILL_DATA.targetMagnet.cd;
    const rangePx = SKILL_DATA.targetMagnet.range * 32;
    const enemies = [...state.entities, ...state.bosses.filter((b) => false)];
    let nearest = null;
    let nearestDist = Infinity;
    for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < nearestDist && dist <= rangePx) {
            nearestDist = dist;
            nearest = enemy;
        }
    }
    if (!nearest) return;
    nearest.x = player.x + Math.cos(player.angle) * 48;
    nearest.y = player.y + Math.sin(player.angle) * 48;
    addLog("Target-Magnet pulled an enemy");
}

function castBerserker(nowSec) {
    if (player.skillCd.berserker > nowSec) return;
    player.skillCd.berserker = nowSec + SKILL_DATA.berserker.cd;
    player.buffs.berserkerUntil = nowSec + SKILL_DATA.berserker.duration;
    addLog("Berserker enabled (+30% all)");
}

function switchWeapon() {
    if (player.weapons.length <= 1) return;
    player.activeWeapon = (player.activeWeapon + 1) % player.weapons.length;
}

function getSkillUiList() {
    return [
        { id: "shockWave", key: "Q", label: "Shock", color: "#52c7ff" },
        { id: "fireShot", key: "E", label: "Fire", color: "#ff9440" },
        { id: "targetMagnet", key: "F", label: "Magnet", color: "#d57cff" },
        { id: "berserker", key: "V", label: "Berserk", color: "#ff5e5e" }
    ];
}

function tryCraftWeapon(id) {
    const recipe = CRAFT_RECIPES[id];
    if (!recipe) return;
    if (WEAPON_DATA[id]?.gatherOnly) {
        addLog("Shovel is starter only");
        return;
    }
    if (getCraftableWeaponCount() >= 2) {
        const replaceIndex = player.weapons.findIndex((w) => w.id !== "shovel" && w.id === getCurrentWeapon()?.id);
        if (replaceIndex >= 0) {
            player.weapons.splice(replaceIndex, 1);
            if (player.activeWeapon >= player.weapons.length) player.activeWeapon = Math.max(0, player.weapons.length - 1);
            addLog("Replaced current combat weapon");
        } else {
            addLog("Max 2 combat weapons. Equip target to replace.");
            return;
        }
    }
    if (player.weapons.some((w) => w.id === id)) {
        addLog("You already own that weapon");
        return;
    }
    if (player.inventory.wood < recipe.wood || player.inventory.stone < recipe.stone) {
        addLog("Not enough wood/stone");
        return;
    }
    player.inventory.wood -= recipe.wood;
    player.inventory.stone -= recipe.stone;
    const sharpness = pickWeightedSharpness();
    const insertAt = player.weapons.findIndex((w) => w.id === "shovel");
    if (insertAt >= 0) player.weapons.splice(insertAt + 1, 0, { id, sharpness, tier: "gold" });
    else player.weapons.push({ id, sharpness, tier: "gold" });
    addLog(`${WEAPON_DATA[id].name} crafted (${sharpness.name})`);
}

function tryCraftArmor(kind) {
    const recipe = ARMOR_RECIPES[kind];
    if (!recipe) return;
    if (player.level < recipe.level) {
        addLog(`Need level ${recipe.level} for ${kind}`);
        return;
    }
    if (player.inventory.stone < recipe.stone) {
        addLog("Not enough stone");
        return;
    }
    player.inventory.stone -= recipe.stone;
    if (kind.includes("Helmet")) player.armor.helmet = kind;
    if (kind.includes("Wings")) player.armor.wings = kind;
    addLog(`${kind} crafted`);
}

function tryUpgradeWeaponTier() {
    const w = getCurrentWeapon();
    if (!w) return;
    const tierOrder = Object.keys(WEAPON_TIERS);
    const idx = tierOrder.indexOf(w.tier);
    if (idx >= tierOrder.length - 1) return;
    const next = tierOrder[idx + 1];
    if (next === "divine" && player.inventory.ultimateEssence <= 0) {
        addLog("Divine needs Ultimate Essence");
        return;
    }
    if (next === "divine") player.inventory.ultimateEssence -= 1;
    if (next === "blue") {
        addLog("Blue tier admin only");
        return;
    }
    w.tier = next;
    addLog(`Weapon tier upgraded to ${next}`);
}

function tryUpgradeArmorTier() {
    if (player.armor.tierIndex >= ARMOR_TIERS.length - 1) return;
    const nextTier = ARMOR_TIERS[player.armor.tierIndex + 1];
    if (nextTier === "divine" && player.inventory.ultimateEssence <= 0) {
        addLog("Armor divine needs Ultimate Essence");
        return;
    }
    if (nextTier === "divine") player.inventory.ultimateEssence -= 1;
    player.armor.tierIndex += 1;
    addLog(`Armor upgraded to ${nextTier}`);
}

function tryCreateClan() {
    if (player.clanId) {
        addLog("Already in a clan");
        return;
    }
    if (player.inventory.gold < 1000) {
        addLog("Need 1000 gold for clan");
        return;
    }
    player.inventory.gold -= 1000;
    const clan = {
        id: crypto.randomUUID(),
        name: `${playerName}'s Clan`,
        tier: "I",
        capacity: 4
    };
    state.clans.push(clan);
    player.clanId = clan.id;
    addLog("Clan created (Tier I, cap 4)");
}

function sellResource(type, amount) {
    if (!SELL_VALUES[type]) return;
    if (player.inventory[type] < amount) {
        addLog(`Not enough ${type} to sell`);
        return;
    }
    player.inventory[type] -= amount;
    const payout = amount * SELL_VALUES[type];
    player.inventory.gold += payout;
    addLog(`Sold ${amount} ${type} for ${payout} gold`);
}

function dash(nowSec) {
    if (player.dashCooldown > nowSec) return;
    player.dashCooldown = nowSec + 1.2;
    const dx = mouse.x - canvas.width / 2;
    const dy = mouse.y - canvas.height / 2;
    const mag = Math.hypot(dx, dy) || 1;
    player.x += (dx / mag) * 210;
    player.y += (dy / mag) * 210;
    clampToWorld(player);
}

function applyPlayerDamage(source, amount, nowSec) {
    if (nowSec < player.buffs.spawnProtectionUntil) return;
    const safeAmount = Math.max(0, amount);
    if (safeAmount <= 0) return;
    player.hp -= safeAmount;
    registerDamage(source, safeAmount, nowSec);
    spawnFloatingText(player.x, player.y - 28, `-${Math.round(safeAmount)}`, "#ff5c5c");
}

function updatePlayer(dt, nowSec) {
    const stats = computeStats(player, nowSec);
    player.maxHp = stats.maxHp;
    if (player.hp > player.maxHp) player.hp = player.maxHp;

    let dx = 0;
    let dy = 0;
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    const mag = Math.hypot(dx, dy) || 1;
    player.x += (dx / mag) * stats.speed * 16 * dt;
    player.y += (dy / mag) * stats.speed * 16 * dt;
    clampToWorld(player);
    player.angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);

    if (player.bleedUntil > nowSec && Math.floor(nowSec * 10) % 30 === 0) {
        applyPlayerDamage("Bleed", 0.7, nowSec);
    }

    const outOfCombat = nowSec - player.lastCombatAt > 4;
    if (outOfCombat && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 3.2 * dt);
    }

    if (player.hp <= 0) {
        const entry = {
            name: playerName,
            score: Number(state.score.toFixed(1)),
            at: new Date().toISOString()
        };
        state.leaderboard.push(entry);
        state.leaderboard.sort((a, b) => b.score - a.score);
        state.leaderboard = state.leaderboard.slice(0, 10);
        localStorage.setItem("crimsonLeaderboard", JSON.stringify(state.leaderboard));
        state.score = 0;
        state.entities = [];
        state.bosses = [];
        Object.assign(player, createPlayer());
        player.buffs.spawnProtectionUntil = nowSec + 4;
        state.spawnTimer = 0.4;
        state.bossSpawnTimer = 16;
        addLog("You died. Run score reset.");
        gameOverMessageUntil = nowSec + 2.5;
    }
}

function updateEntities(dt, nowSec) {
    const allEnemies = [...state.entities, ...state.bosses];
    for (const enemy of allEnemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (enemy.type === "boss") {
            runBossBrain(enemy, dt, nowSec, dx, dy, dist);
        } else {
            const aggroRange = 560;
            const leashRange = 860;
            if (dist < aggroRange) enemy.chasing = true;
            if (dist > leashRange) enemy.chasing = false;
            if (enemy.chasing) {
                enemy.x += (dx / dist) * enemy.speed * 16 * dt;
                enemy.y += (dy / dist) * enemy.speed * 16 * dt;
            }
            if (dist < 42 && enemy.attackCooldown < nowSec) {
                enemy.attackCooldown = nowSec + 1.4;
                const dmg = Math.max(1, enemy.baseAtk - computeStats(player, nowSec).def * 0.2);
                applyPlayerDamage("Raider melee", dmg, nowSec);
            }
        }

        if (enemy.burnUntil > nowSec && nowSec >= enemy.burnTickAt) {
            enemy.burnTickAt = nowSec + SKILL_DATA.fireShot.burnTick;
            damageTarget(enemy, SKILL_DATA.fireShot.burnDmg, "player", nowSec);
        }
    }
}

function runBossBrain(boss, dt, nowSec, dx, dy, dist) {
    const phase = boss.hp <= boss.maxHp * 0.5 ? 2 : 1;
    boss.bossPhase = phase;
    boss.bossStateTimer -= dt;
    if (dist > 520) {
        const ndx = dx / dist;
        const ndy = dy / dist;
        state.effects.push({ x: player.x, y: player.y, text: "Ground Rupture", until: nowSec + 0.8 });
        applyPlayerDamage("Ground Rupture", 8, nowSec);
        boss.x += ndx * 200 * dt;
        boss.y += ndy * 200 * dt;
        return;
    }
    if (boss.telegraphUntil > nowSec) {
        state.effects.push({ x: boss.x, y: boss.y - 48, text: boss.queuedAction || "Warning", until: nowSec + 0.1 });
        return;
    }
    if (boss.bossStateTimer > 0) return;

    if (phase === 1) {
        const cycle = ["slam", "dashStrike", "rest", "magnetPulse", "spiritCone"];
        const action = cycle[Math.floor(nowSec) % cycle.length];
        boss.queuedAction = action;
        boss.telegraphUntil = nowSec + 0.45;
        if (action === "slam") {
            if (dist < 90) applyPlayerDamage("Boss Heavy Slam", 23, nowSec);
            boss.bossStateTimer = 1.4;
            state.effects.push({ x: boss.x, y: boss.y, text: "Heavy Slam", until: nowSec + 0.7 });
        } else if (action === "dashStrike") {
            boss.x += (dx / dist) * 160;
            boss.y += (dy / dist) * 160;
            if (dist < 130) applyPlayerDamage("Boss Dash Strike", 20, nowSec);
            boss.bossStateTimer = 1.4;
        } else if (action === "magnetPulse") {
            player.x = boss.x + (Math.random() > 0.5 ? -60 : 60);
            player.y = boss.y;
            applyPlayerDamage("Boss Magnet Pulse", 12, nowSec);
            boss.bossStateTimer = 3.2;
        } else if (action === "spiritCone") {
            if (dist < 240) applyPlayerDamage("Boss Spirit Cone", 14, nowSec);
            boss.bossStateTimer = 1.5;
        } else {
            boss.bossStateTimer = 2.5;
        }
    } else {
        const cycle = ["superWibuu", "spamCombo", "spiritExplode", "berserker"];
        const action = cycle[Math.floor(nowSec * 1.2) % cycle.length];
        boss.queuedAction = action;
        boss.telegraphUntil = nowSec + 0.45;
        if (action === "superWibuu") {
            if (dist < 200) {
                applyPlayerDamage("Boss Super Wibuu", 17, nowSec);
                player.bleedUntil = nowSec + 9;
            }
            boss.bossStateTimer = 1.4;
        } else if (action === "spamCombo") {
            boss.x += (dx / dist) * 220;
            boss.y += (dy / dist) * 220;
            if (dist < 160) applyPlayerDamage("Boss Combo", 18, nowSec);
            boss.bossStateTimer = 1.8;
        } else if (action === "spiritExplode") {
            if (dist < 260) applyPlayerDamage("Spirit Explode", 14, nowSec);
            boss.bossStateTimer = 1.8;
        } else {
            boss.speed = 7;
            if (dist < 130) applyPlayerDamage("Boss Berserker Hit", 19, nowSec);
            boss.bossStateTimer = 1.6;
        }
    }
}

function updateProjectiles(dt, nowSec) {
    for (const p of state.projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        for (const enemy of [...state.entities, ...state.bosses]) {
            const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
            if (dist < enemy.radius + 10) {
                damageTarget(enemy, p.damage, "player", nowSec);
                enemy.burnUntil = nowSec + 9;
                enemy.burnTickAt = nowSec + SKILL_DATA.fireShot.burnTick;
                p.life = 0;
            }
        }
    }
    state.projectiles = state.projectiles.filter((p) => p.life > nowSec);
    state.effects = state.effects
        .map((e) => {
            if (e.type === "shockWave") {
                return { ...e, radius: Math.min(e.maxRadius, e.radius + e.maxRadius * 5.2 * dt) };
            }
            return e;
        })
        .filter((e) => e.until > nowSec);
    state.floatingText = state.floatingText
        .map((t) => ({ ...t, y: t.y - 18 * dt, ttl: t.ttl - dt }))
        .filter((t) => t.ttl > 0);
}

function spawnLoop(dt, nowSec) {
    state.spawnTimer -= dt;
    state.bossSpawnTimer -= dt;
    const difficulty = Math.min(1.7, 0.85 + player.level * 0.08 + nowSec / 300);
    if (state.spawnTimer <= 0) {
        state.spawnTimer = Math.max(1.4, 3.2 / difficulty);
        if (state.entities.length < 8 + Math.floor(player.level * 0.8)) spawnEnemy("raider", nowSec);
    }
    const maxBosses = player.level < 4 ? 0 : player.level < 10 ? 1 : 2;
    if (state.bossSpawnTimer <= 0 && state.bosses.length < maxBosses) {
        state.bossSpawnTimer = Math.max(12, 24 - player.level);
        spawnEnemy("boss", nowSec);
    }
}

function update(dt, nowSec) {
    if (!running) return;
    ensureResourcePopulation();
    updatePlayer(dt, nowSec);
    updateEntities(dt, nowSec);
    updateProjectiles(dt, nowSec);
    spawnLoop(dt, nowSec);
    draw(nowSec);
}

function worldToScreen(x, y) {
    return {
        x: (x - player.x) * CAMERA_ZOOM + canvas.width / 2,
        y: (y - player.y) * CAMERA_ZOOM + canvas.height / 2
    };
}

function draw(nowSec) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();

    for (const node of state.resources) {
        const p = worldToScreen(node.x, node.y);
        const tex = node.type === "wood" ? "woodNode" : node.type === "stone" ? "stoneNode" : "goldNode";
        drawSpriteOrFallback(tex, p.x, p.y, 32 * CAMERA_ZOOM, 32 * CAMERA_ZOOM, node.type === "wood" ? "#4d7c38" : node.type === "stone" ? "#8b929e" : "#d4af37");
        const hpRatio = Math.max(0, node.hp / RESOURCE_NODE_HP);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(p.x - 18, p.y + 16, 36, 4);
        ctx.fillStyle = "#7CFFB8";
        ctx.fillRect(p.x - 18, p.y + 16, 36 * hpRatio, 4);
    }

    for (const enemy of state.entities) {
        const p = worldToScreen(enemy.x, enemy.y);
        drawSpriteOrFallback("raider", p.x, p.y, enemy.radius * 2 * CAMERA_ZOOM, enemy.radius * 2 * CAMERA_ZOOM, "#c54848");
    }
    for (const boss of state.bosses) {
        const p = worldToScreen(boss.x, boss.y);
        drawSpriteOrFallback(boss.bossPhase === 1 ? "bossP1" : "bossP2", p.x, p.y, boss.radius * 2.1 * CAMERA_ZOOM, boss.radius * 2.1 * CAMERA_ZOOM, "#8227c7");
    }

    for (const proj of state.projectiles) {
        const p = worldToScreen(proj.x, proj.y);
        drawSpriteOrFallback("fireShot", p.x, p.y, 16 * CAMERA_ZOOM, 16 * CAMERA_ZOOM, "#ff8c00");
    }

    const me = worldToScreen(player.x, player.y);
    const playerKey = nowSec < player.buffs.berserkerUntil ? "playerBerserk" : "player";
    ctx.save();
    ctx.translate(me.x, me.y);
    ctx.rotate(player.angle + Math.PI / 2);
    drawSpriteOrFallback(playerKey, 0, 0, player.radius * 2.2, player.radius * 2.2, nowSec < player.buffs.berserkerUntil ? "#ff3333" : "#e64b4b");
    ctx.restore();
    const activeWeapon = getCurrentWeapon();
    const weaponTex = getWeaponTextureKey(activeWeapon?.id);
    const swingRatio = Math.max(0, (player.swingUntil - nowSec) / 0.16);
    const swingOffset = swingRatio > 0 ? Math.sin((1 - swingRatio) * Math.PI) * 0.9 * player.swingDirection : 0;
    const weaponAngle = player.angle + Math.PI / 2 + swingOffset;
    const weaponReach = (30 + 8 * swingRatio) * CAMERA_ZOOM;
    const wx = me.x + Math.cos(player.angle + swingOffset * 0.35) * weaponReach;
    const wy = me.y + Math.sin(player.angle + swingOffset * 0.35) * weaponReach;
    if (weaponTex) drawRotatedSpriteOrFallback(weaponTex, wx, wy, 38 * CAMERA_ZOOM, 38 * CAMERA_ZOOM, weaponAngle, "#f0f0f0");

    for (const fx of state.effects) {
        const p = worldToScreen(fx.x, fx.y);
        if (fx.type === "shockWave") {
            const tex = textures.shockWave;
            if (tex?.loaded) {
                ctx.globalAlpha = 0.75;
                ctx.drawImage(tex.img, p.x - fx.radius, p.y - fx.radius, fx.radius * 2, fx.radius * 2);
                ctx.globalAlpha = 1;
            } else {
                ctx.strokeStyle = "#7ad7ff";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, fx.radius * CAMERA_ZOOM, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (fx.type === "hitArc") {
            ctx.strokeStyle = "#ffef9f";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.min(70, fx.range * 0.35 * CAMERA_ZOOM), fx.angle - 0.32, fx.angle + 0.32);
            ctx.stroke();
        } else {
            ctx.fillStyle = "#ffd166";
            ctx.font = "14px Arial";
            ctx.fillText(fx.text, p.x - 30, p.y - 30);
        }
    }
    for (const ft of state.floatingText) {
        const p = worldToScreen(ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.font = "14px Arial";
        ctx.fillText(ft.text, p.x, p.y);
    }

    if (uiVisibility.hud) drawHud(nowSec);
    if (state.craftUi.open) drawCraftSellWindow();
    if (gameOverMessageUntil > nowSec) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "28px Arial";
        ctx.fillText("You died. Score reset, leaderboard saved.", 30, canvas.height - 40);
    }
}

function drawButton(btn) {
    ctx.fillStyle = "rgba(44,44,44,0.9)";
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = "#b5b5b5";
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = "#fff";
    ctx.font = "13px Arial";
    ctx.fillText(btn.label, btn.x + 8, btn.y + 19);
}

function buildCraftSellButtons(panelX, panelY) {
    const buttons = [];
    const pushBtn = (x, y, label, action) => buttons.push({ x, y, w: 265, h: 26, label, action });
    let y = panelY + 42;
    pushBtn(panelX + 18, y, "Craft Dagger (50W 15S)", { type: "craftWeapon", id: "dagger" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Sword (75W 25S)", { type: "craftWeapon", id: "sword" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Long Sword (50W 50S)", { type: "craftWeapon", id: "longSword" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Spear (75W 25S)", { type: "craftWeapon", id: "spear" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Axe (50W 80S)", { type: "craftWeapon", id: "axe" }); y += 40;

    pushBtn(panelX + 18, y, "Craft Light Helmet (100S, Lv3)", { type: "craftArmor", id: "lightHelmet" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Light Wings (150S, Lv3)", { type: "craftArmor", id: "lightWings" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Medium Helmet (225S, Lv5)", { type: "craftArmor", id: "mediumHelmet" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Medium Wings (300S, Lv5)", { type: "craftArmor", id: "mediumWings" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Heavy Helmet (550S, Lv8)", { type: "craftArmor", id: "heavyHelmet" }); y += 30;
    pushBtn(panelX + 18, y, "Craft Heavy Wings (900S, Lv8)", { type: "craftArmor", id: "heavyWings" });

    let sy = panelY + 88;
    const sellX = panelX + 332;
    buttons.push({ x: sellX, y: sy - 34, w: 230, h: 26, label: "Sell Wood x10 (+10 Gold)", action: { type: "sell", id: "wood", amount: 10 } });
    buttons.push({ x: sellX, y: sy, w: 230, h: 26, label: "Sell Wood x50 (+50 Gold)", action: { type: "sell", id: "wood", amount: 50 } });
    sy += 34;
    buttons.push({ x: sellX, y: sy, w: 230, h: 26, label: "Sell Stone x10 (+20 Gold)", action: { type: "sell", id: "stone", amount: 10 } });
    sy += 34;
    buttons.push({ x: sellX, y: sy, w: 230, h: 26, label: "Sell Stone x50 (+100 Gold)", action: { type: "sell", id: "stone", amount: 50 } });
    sy += 44;
    buttons.push({ x: sellX, y: sy, w: 230, h: 26, label: "Upgrade Weapon Tier", action: { type: "upgradeWeapon" } });
    sy += 34;
    buttons.push({ x: sellX, y: sy, w: 230, h: 26, label: "Upgrade Armor Tier", action: { type: "upgradeArmor" } });
    return buttons;
}

function drawCraftSellWindow() {
    const panelW = 600;
    const panelH = 470;
    const x = canvas.width / 2 - panelW / 2;
    const y = canvas.height / 2 - panelH / 2;
    state.craftUi.buttons = buildCraftSellButtons(x, y);

    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawHudPanel(x, y, panelW, panelH);
    ctx.strokeStyle = "#e5e5e5";
    ctx.strokeRect(x, y, panelW, panelH);
    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText("Craft & Sell Menu (Press P to close)", x + 18, y + 28);
    ctx.font = "14px Arial";
    ctx.fillText("Crafting", x + 18, y + 54);
    ctx.fillText("Sell / Upgrade", x + 332, y + 54);
    ctx.fillText(`You: Wood ${player.inventory.wood} | Stone ${player.inventory.stone} | Gold ${player.inventory.gold}`, x + 332, y + 76);
    for (const btn of state.craftUi.buttons) drawButton(btn);
}

function handleCraftMenuClick(mouseX, mouseY) {
    for (const btn of state.craftUi.buttons) {
        const inside = mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h;
        if (!inside) continue;
        if (btn.action.type === "craftWeapon") tryCraftWeapon(btn.action.id);
        if (btn.action.type === "craftArmor") tryCraftArmor(btn.action.id);
        if (btn.action.type === "sell") sellResource(btn.action.id, btn.action.amount);
        if (btn.action.type === "upgradeWeapon") tryUpgradeWeaponTier();
        if (btn.action.type === "upgradeArmor") tryUpgradeArmorTier();
        return true;
    }
    return false;
}

function drawTerrain() {
    const tileSize = 128;
    const halfWorldViewW = canvas.width / (2 * CAMERA_ZOOM);
    const halfWorldViewH = canvas.height / (2 * CAMERA_ZOOM);
    const startX = Math.floor((player.x - halfWorldViewW) / tileSize) - 1;
    const endX = Math.floor((player.x + halfWorldViewW) / tileSize) + 1;
    const startY = Math.floor((player.y - halfWorldViewH) / tileSize) - 1;
    const endY = Math.floor((player.y + halfWorldViewH) / tileSize) + 1;
    for (let gx = startX; gx <= endX; gx += 1) {
        for (let gy = startY; gy <= endY; gy += 1) {
            const wx = gx * tileSize;
            const wy = gy * tileSize;
            const dist = Math.hypot(wx, wy);
            const tex = dist <= LAKE_RADIUS ? "lake" : dist <= LAKE_RADIUS + 900 ? "stone" : (Math.abs(gx + gy + state.worldSeed) % 2 ? "grass" : "dirt");
            const p = worldToScreen(wx, wy);
            drawTileOrFallback(tex, p.x, p.y, tileSize * CAMERA_ZOOM, tileSize * CAMERA_ZOOM);
        }
    }
}

function drawTileOrFallback(key, x, y, w, h) {
    const tex = textures[key];
    if (tex?.loaded) {
        ctx.drawImage(tex.img, x, y, w, h);
        return;
    }
    ctx.fillStyle = key === "lake" ? "#124f7d" : key === "stone" ? "#545f66" : key === "dirt" ? "#5d4930" : "#25441f";
    ctx.fillRect(x, y, w, h);
}

function drawSpriteOrFallback(key, x, y, w, h, fallbackColor) {
    const tex = textures[key];
    if (tex?.loaded) {
        ctx.drawImage(tex.img, x - w / 2, y - h / 2, w, h);
        return;
    }
    ctx.fillStyle = fallbackColor;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(w, h) * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawRotatedSpriteOrFallback(key, x, y, w, h, angle, fallbackColor) {
    const tex = textures[key];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (tex?.loaded) {
        ctx.drawImage(tex.img, -w / 2, -h / 2, w, h);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(w, h) * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawHud(nowSec) {
    const stats = computeStats(player, nowSec);
    const weapon = getCurrentWeapon();
    drawHudPanel(10, 10, 540, 260);
    ctx.fillStyle = "#fff";
    ctx.font = "15px Arial";
    ctx.fillText(`${playerName} | Lv ${player.level} | XP ${player.xp.toFixed(1)}/${getLevelRequirement(player.level)}`, 20, 34);
    ctx.fillText(`HP ${player.hp.toFixed(1)}/${player.maxHp.toFixed(1)} | ATK ${stats.atk.toFixed(1)} | DEF ${stats.def.toFixed(1)} | SPD ${stats.speed.toFixed(1)}`, 20, 58);
    ctx.fillText(`Resources: Wood ${player.inventory.wood} Stone ${player.inventory.stone} Gold ${player.inventory.gold} UE ${player.inventory.ultimateEssence}`, 20, 82);
    if (weapon) {
        ctx.fillText(`Weapon ${WEAPON_DATA[weapon.id].name} (${weapon.sharpness.name}, ${weapon.tier}) DMG ${getWeaponDamage(weapon, stats.atk / 5).toFixed(1)}`, 20, 106);
        const weaponIcon = getWeaponTextureKey(weapon.id);
        if (weaponIcon) drawSpriteOrFallback(weaponIcon, 500, 98, 26, 26, "#d8d8d8");
    }
    const helmet = player.armor.helmet || "none";
    const wings = player.armor.wings || "none";
    const armorTier = ARMOR_TIERS[player.armor.tierIndex];
    ctx.fillText(`Armor Helmet:${helmet} Wings:${wings} Tier:${armorTier}`, 20, 130);
    ctx.fillText(`Score ${state.score.toFixed(1)} | Pos (${Math.round(player.x)}, ${Math.round(player.y)})`, 20, 154);

    const keybinds = "LMB attack | Space dash | Slots: 1 Shovel, 2 Main, 3 Secondary | Skills: Q E F V";
    ctx.fillText(keybinds, 20, 178);
    ctx.fillText("Craft: Z/X/C/R/B weapons | H/J/N/M/G/K armor | U weapon tier | I armor tier | O clan", 20, 202);
    ctx.fillText(`Combat weapons: ${getCraftableWeaponCount()}/2 (shovel excluded)`, 20, 224);
    if (nowSec < player.buffs.spawnProtectionUntil) ctx.fillText("Spawn Protection Active", 320, 224);
    ctx.fillText("Toggle panels: F1 HUD F2 Board F3 Log F4 MiniMap F5 Recap", 20, 246);

    if (uiVisibility.leaderboard) {
        drawHudPanel(canvas.width - 280, 10, 270, 210);
        ctx.fillStyle = "#fff";
        ctx.fillText("Global Leaderboard", canvas.width - 260, 34);
        state.leaderboard.forEach((entry, i) => {
            ctx.fillText(`${i + 1}. ${entry.name} - ${entry.score}`, canvas.width - 260, 58 + i * 18);
        });
    }

    if (uiVisibility.battleLog) {
        drawHudPanel(10, canvas.height - 160, 470, 150);
        ctx.fillStyle = "#fff";
        ctx.fillText("Battle Log", 20, canvas.height - 136);
        battleLog.forEach((line, idx) => {
            ctx.fillText(`- ${line}`, 20, canvas.height - 112 + idx * 18);
        });
    }
    if (uiVisibility.minimap) drawMiniMap();
    if (uiVisibility.recap) drawDeathRecapPanel();
    drawActionBars(nowSec);
}

function drawHudPanel(x, y, w, h) {
    const tex = textures.hudPanel;
    if (tex?.loaded) {
        ctx.drawImage(tex.img, x, y, w, h);
        return;
    }
    ctx.fillStyle = "rgba(10,10,10,0.67)";
    ctx.fillRect(x, y, w, h);
}

function drawMiniMap() {
    const mapW = 190;
    const mapH = 190;
    const x = canvas.width - mapW - 16;
    const y = canvas.height - mapH - 16;
    const tex = textures.minimapFrame;
    if (tex?.loaded) {
        ctx.drawImage(tex.img, x, y, mapW, mapH);
    } else {
        drawHudPanel(x, y, mapW, mapH);
    }
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(x, y, mapW, mapH);
    const toMini = (wx, wy) => ({
        x: x + ((wx + HALF_WORLD) / WORLD_SIZE) * mapW,
        y: y + ((wy + HALF_WORLD) / WORLD_SIZE) * mapH
    });
    const me = toMini(player.x, player.y);
    ctx.fillStyle = "#66d9ff";
    ctx.fillRect(me.x - 2, me.y - 2, 4, 4);
    ctx.fillStyle = "#8f5de8";
    for (const boss of state.bosses) {
        const b = toMini(boss.x, boss.y);
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    }
    ctx.fillStyle = "#6cff79";
    for (const node of state.resources.slice(0, 25)) {
        const n = toMini(node.x, node.y);
        ctx.fillRect(n.x, n.y, 2, 2);
    }
}

function drawDeathRecapPanel() {
    drawHudPanel(canvas.width / 2 - 180, 12, 360, 120);
    ctx.fillStyle = "#fff";
    ctx.fillText("Recent Damage", canvas.width / 2 - 160, 34);
    state.deathRecap.forEach((line, idx) => ctx.fillText(line, canvas.width / 2 - 160, 58 + idx * 17));
}

function drawActionBars(nowSec) {
    const slotW = 70;
    const slotH = 70;
    const baseY = canvas.height - slotH - 14;
    const centerX = canvas.width / 2 - 2 * slotW;
    const slotLabels = [
        { slot: 1, name: "Shovel" },
        { slot: 2, name: "Main" },
        { slot: 3, name: "Secondary" }
    ];
    for (let i = 0; i < slotLabels.length; i += 1) {
        const x = centerX + i * (slotW + 8);
        const slotWeapon = getWeaponBySlot(slotLabels[i].slot);
        const isActive = slotWeapon && slotWeapon === getCurrentWeapon();
        ctx.fillStyle = isActive ? "rgba(170,130,42,0.9)" : "rgba(25,25,25,0.82)";
        ctx.fillRect(x, baseY, slotW, slotH);
        ctx.strokeStyle = "#cfcfcf";
        ctx.strokeRect(x, baseY, slotW, slotH);
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.fillText(String(slotLabels[i].slot), x + 4, baseY + 14);
        if (slotWeapon) {
            const icon = getWeaponTextureKey(slotWeapon.id);
            if (icon) drawSpriteOrFallback(icon, x + slotW / 2, baseY + slotH / 2, 38, 38, "#ddd");
            ctx.fillText(WEAPON_DATA[slotWeapon.id].name, x + 4, baseY + slotH - 6);
        } else {
            ctx.fillText("Empty", x + 4, baseY + slotH - 6);
        }
    }

    const skills = getSkillUiList();
    for (let i = 0; i < skills.length; i += 1) {
        const s = skills[i];
        const x = centerX + (3 * (slotW + 8)) + 12 + i * (slotW + 8);
        ctx.fillStyle = "rgba(25,25,25,0.84)";
        ctx.fillRect(x, baseY, slotW, slotH);
        ctx.strokeStyle = "#b7b7b7";
        ctx.strokeRect(x, baseY, slotW, slotH);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText(s.key, x + 4, baseY + 14);
        ctx.fillStyle = s.color;
        ctx.fillRect(x + 14, baseY + 20, 42, 28);
        ctx.fillStyle = "#0f0f0f";
        ctx.font = "10px Arial";
        ctx.fillText(s.label, x + 18, baseY + 37);
        const remain = Math.max(0, player.skillCd[s.id] - nowSec);
        if (remain > 0) {
            const ratio = Math.min(1, remain / SKILL_DATA[s.id].cd);
            ctx.fillStyle = "rgba(0,0,0,0.62)";
            ctx.fillRect(x, baseY, slotW, slotH * ratio);
            ctx.fillStyle = "#fff";
            ctx.font = "14px Arial";
            ctx.fillText(remain.toFixed(0), x + slotW / 2 - 4, baseY + slotH / 2 + 5);
        }
    }

    const btnX = centerX + (7 * (slotW + 8)) + 18;
    const btnY = baseY + 18;
    const btnW = 120;
    const btnH = 34;
    state.craftUi.toggleButton = { x: btnX, y: btnY, w: btnW, h: btnH };
    ctx.fillStyle = state.craftUi.open ? "rgba(120,76,26,0.95)" : "rgba(36,78,122,0.95)";
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = "#dddddd";
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Arial";
    ctx.fillText("Craft/Sell [P]", btnX + 14, btnY + 22);
}

function gameLoop(ts) {
    const nowSec = ts / 1000;
    const dt = Math.min(0.033, (ts - lastTimestamp) / 1000 || 0.016);
    lastTimestamp = ts;
    update(dt, nowSec);
    requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (!running) return;
    const nowSec = performance.now() / 1000;
    const key = e.key.toLowerCase();
    if (key === "1") equipWeaponSlot(1);
    if (key === "2") equipWeaponSlot(2);
    if (key === "3") equipWeaponSlot(3);
    if (key === "q") castShockWave(nowSec);
    if (key === "e") castFireShot(nowSec);
    if (key === "f") castTargetMagnet(nowSec);
    if (key === "v") castBerserker(nowSec);
    if (key === " ") dash(nowSec);
    if (key === "z") tryCraftWeapon("dagger");
    if (key === "x") tryCraftWeapon("sword");
    if (key === "c") tryCraftWeapon("longSword");
    if (key === "r") tryCraftWeapon("spear");
    if (key === "b") tryCraftWeapon("axe");
    if (key === "h") tryCraftArmor("lightHelmet");
    if (key === "j") tryCraftArmor("lightWings");
    if (key === "n") tryCraftArmor("mediumHelmet");
    if (key === "m") tryCraftArmor("mediumWings");
    if (key === "g") tryCraftArmor("heavyHelmet");
    if (key === "k") tryCraftArmor("heavyWings");
    if (key === "u") tryUpgradeWeaponTier();
    if (key === "i") tryUpgradeArmorTier();
    if (key === "o") tryCreateClan();
    if (key === "f1") { e.preventDefault(); uiVisibility.hud = !uiVisibility.hud; }
    if (key === "f2") { e.preventDefault(); uiVisibility.leaderboard = !uiVisibility.leaderboard; }
    if (key === "f3") { e.preventDefault(); uiVisibility.battleLog = !uiVisibility.battleLog; }
    if (key === "f4") { e.preventDefault(); uiVisibility.minimap = !uiVisibility.minimap; }
    if (key === "f5") { e.preventDefault(); uiVisibility.recap = !uiVisibility.recap; }
    if (key === "p" || key === "tab") {
        e.preventDefault();
        state.craftUi.open = !state.craftUi.open;
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || !running) return;
    if (state.craftUi.open) {
        if (!handleCraftMenuClick(e.clientX, e.clientY)) state.craftUi.open = false;
        return;
    }
    const t = state.craftUi.toggleButton;
    if (t && e.clientX >= t.x && e.clientX <= t.x + t.w && e.clientY >= t.y && e.clientY <= t.y + t.h) {
        state.craftUi.open = true;
        return;
    }
    attack(performance.now() / 1000);
});

document.getElementById("playBtn").addEventListener("click", () => {
    const input = document.querySelector(".menu input").value.trim();
    playerName = input || "Unknown";
    document.querySelector(".menu").style.display = "none";
    canvas.style.display = "block";
    running = true;
    preloadTextures();
    player.buffs.spawnProtectionUntil = performance.now() / 1000 + 4;
    ensureResourcePopulation();
    ensureStarterResources();
    state.spawnTimer = 0.35;
    state.bossSpawnTimer = 16;
    for (let i = 0; i < 3; i += 1) spawnEnemy("raider");
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

requestAnimationFrame(gameLoop);