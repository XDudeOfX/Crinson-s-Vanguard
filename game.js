const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WORLD_SIZE = 5600;
const HALF_WORLD = WORLD_SIZE / 2;
const LAKE_RADIUS = 420;
const RESOURCE_NODE_HP = 400;
const RESOURCE_GATHER_DAMAGE = 40;
const RESOURCE_LIMITS = { wood: 60, stone: 48, gold: 6 };
const RESOURCE_RESPAWN_SEC = 20;
const RESOURCE_DROP_RATE = { wood: 0.6, stone: 0.3, gold: 0.1 };
const SPAWN_SAFE_RADIUS = 540;
const CAMERA_ZOOM = 2.05;
const SELL_VALUES = { wood: 1, stone: 2 };
const ATTACK_SPEED_MULT = 0.55;
const BOSS_ATTACK_RANGE = 220;
const BOSS_LEASH_RANGE = 420;
const BOSS_KITE_MIN = 140;
const BOSS_KITE_MAX = 280;
const BOSS_DASH_CD = 7;
const BOSS_DASH_SPEED = 210;
const BOSS_DASH_DURATION = 0.45;
const BOSS_DASH_MIN_RANGE = 65;
const BOSS_DASH_MAX_RANGE = 340;
const BOSS_DASH_DAMAGE = 22;
const BOSS_MELEE_TOUCH_PAD = 4;
const BOSS_CONTACT_REST_MIN = 2;
const BOSS_CONTACT_REST_MAX = 4;
const BOSS_SPAWN_DELAY = 22;
const RAIDER_ATTACK_RANGE = 200;
const RESOURCE_GRID = 300;
const FOREST_START = LAKE_RADIUS + 900;

const keys = {};
const mouse = { x: 0, y: 0 };
let playerName = "Unknown";
let running = false;
let lastTimestamp = 0;
let battleLog = [];
let gameOverMessageUntil = 0;
const uiVisibility = { stats: true, actionBar: true, armorSlots: true, leaderboard: true, minimap: true };

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
    attackArc: "textures/vfx/attack_arc_slash.png",
    bossSlamWarn: "textures/vfx/boss_slam_warning.png",
    gatherSpark: "textures/vfx/resource_gather_spark.png",
    hitSpark: "textures/vfx/player_hit_spark.png",
    voidTile: "textures/terrain/void_tile.png",
    borderTile: "textures/terrain/world_border_tile.png",
    hudPanel: "textures/ui/hud_panel.png",
    minimapFrame: "textures/ui/minimap_frame.png",
    inventoryPanel: "textures/ui/inventory_panel.png",
    skillShock: "textures/ui/skill_icon_shock.png",
    skillFire: "textures/ui/skill_icon_fire.png",
    skillMagnet: "textures/ui/skill_icon_magnet.png",
    skillBerserk: "textures/ui/skill_icon_berserk.png",
    dropWood: "textures/pickups/wood_drop.png",
    dropStone: "textures/pickups/stone_drop.png",
    dropGold: "textures/pickups/gold_drop.png"
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
    bossSpawnTimer: BOSS_SPAWN_DELAY,
    bossAutoSpawnPaused: false,
    resourceRespawnQueue: [],
    floatingText: [],
    deathRecap: [],
    worldSeed: 1,
    craftUi: { open: false, buttons: [], toggleButton: null }
};

const player = createPlayer();
function createPlayer() {
    return {
        x: 0, y: 0, radius: 18, level: 1, xp: 0, hp: 105, maxHp: 105, baseAtk: 5, speed: 11.5, def: 2, angle: 0,
        weapons: [{ id: "shovel", sharpness: SHARPNESS[0], tier: "gold" }],
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
    player.lastCombatAt = nowSec;
}

function getResourceRadius(type) {
    if (type === "wood") return 38;
    if (type === "stone") return 36;
    return 34;
}

function getBiomeAt(x, y) {
    const dist = Math.hypot(x, y);
    if (dist <= LAKE_RADIUS) return "lake";
    if (dist <= LAKE_RADIUS + 900) return "stoneField";
    return "forest";
}

function returnToMenu() {
    running = false;
    state.craftUi.open = false;
    state.entities = [];
    state.bosses = [];
    state.resources = [];
    state.projectiles = [];
    state.effects = [];
    canvas.style.display = "none";
    document.querySelector(".menu").style.display = "block";
}

function getAttackSpeedMult(weaponId) {
    if (weaponId === "dagger") return ATTACK_SPEED_MULT * 0.5;
    return ATTACK_SPEED_MULT;
}

function circleOverlap(x1, y1, r1, x2, y2, r2) {
    return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
}

function getCollisionBlockers() {
    const blockers = [];
    for (const node of state.resources) {
        blockers.push({ x: node.x, y: node.y, r: node.collRadius });
    }
    for (const enemy of state.entities) {
        blockers.push({ x: enemy.x, y: enemy.y, r: enemy.radius + 2 });
    }
    for (const boss of state.bosses) {
        blockers.push({ x: boss.x, y: boss.y, r: boss.radius + 4 });
    }
    return blockers;
}

function positionBlocked(x, y, radius, extraPadding = 10) {
    return getCollisionBlockers().some((b) => circleOverlap(x, y, radius + extraPadding, b.x, b.y, b.r));
}

function resolveCirclePush(x, y, radius, blockers) {
    let nx = x;
    let ny = y;
    for (let pass = 0; pass < 3; pass += 1) {
        for (const b of blockers) {
            const dx = nx - b.x;
            const dy = ny - b.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const minDist = radius + b.r;
            if (dist < minDist) {
                const push = (minDist - dist) / dist;
                nx += dx * push;
                ny += dy * push;
            }
        }
    }
    return { x: nx, y: ny };
}

function findSafePlayerSpawn() {
    const margin = 450;
    for (let i = 0; i < 120; i += 1) {
        const x = randIn(-HALF_WORLD + margin, HALF_WORLD - margin);
        const y = randIn(-HALF_WORLD + margin, HALF_WORLD - margin);
        if (!positionBlocked(x, y, player.radius, 24)) return { x, y };
    }
    return { x: 0, y: 0 };
}

function movePlayerWithCollision(nx, ny) {
    const resolved = resolveCirclePush(nx, ny, player.radius, getCollisionBlockers());
    player.x = resolved.x;
    player.y = resolved.y;
}

function getBlockersForEntity(entity) {
    const blockers = [];
    for (const node of state.resources) {
        blockers.push({ x: node.x, y: node.y, r: node.collRadius });
    }
    for (const e of state.entities) {
        if (e === entity) continue;
        blockers.push({ x: e.x, y: e.y, r: e.radius + 2 });
    }
    for (const b of state.bosses) {
        blockers.push({ x: b.x, y: b.y, r: b.radius + 4 });
    }
    return blockers;
}

function moveEntityWithCollision(entity, nx, ny, radius) {
    const resolved = resolveCirclePush(nx, ny, radius, getBlockersForEntity(entity));
    entity.x = resolved.x;
    entity.y = resolved.y;
}

function moveBoss(boss, nx, ny) {
    moveEntityWithCollision(boss, nx, ny, boss.radius);
}

function getBossTouchRange(boss) {
    return boss.radius + player.radius + BOSS_MELEE_TOUCH_PAD;
}

function isBossTouchingPlayer(boss) {
    return Math.hypot(player.x - boss.x, player.y - boss.y) <= getBossTouchRange(boss);
}

function bossEngageOnContact(boss, nowSec, aim) {
    if ((boss.contactCd || 0) > nowSec) return;
    boss.dashUntil = 0;
    boss.dashHit = false;
    const rest = randIn(BOSS_CONTACT_REST_MIN, BOSS_CONTACT_REST_MAX);
    boss.touchRestUntil = nowSec + rest;
    boss.postAttackUntil = nowSec + rest;
    boss.attackCooldown = nowSec + rest;
    boss.contactCd = nowSec + rest;
    boss.bossStateTimer = 0;

    const roll = Math.random();
    if (roll < 0.35) {
        telegraphBossAttack(boss, nowSec, {
            x: boss.x,
            y: boss.y,
            radius: 72,
            damage: 26,
            label: "Melee Crush",
            telegraph: 0.65,
            recovery: 0.35
        });
    } else if (roll < 0.7) {
        telegraphBossAttack(boss, nowSec, {
            x: boss.x,
            y: boss.y,
            radius: 88,
            angle: aim,
            arc: Math.PI * 0.7,
            damage: 22,
            label: "Close Cone",
            telegraph: 0.7,
            recovery: 0.35
        });
    } else if ((boss.dashCd || 0) <= nowSec) {
        applyPlayerDamage("Dash Strike", BOSS_DASH_DAMAGE, nowSec);
        boss.dashCd = nowSec + BOSS_DASH_CD;
    } else {
        telegraphBossAttack(boss, nowSec, {
            x: boss.x,
            y: boss.y,
            radius: 65,
            damage: 18,
            label: "Claw Swipe",
            telegraph: 0.55,
            recovery: 0.3
        });
    }
    boss.postAttackUntil = nowSec + rest;
    boss.attackCooldown = nowSec + rest;
}

function telegraphBossAttack(boss, nowSec, config) {
    const telegraph = config.telegraph ?? 1.1;
    state.effects.push({
        type: "bossZone",
        x: config.x,
        y: config.y,
        radius: config.radius,
        angle: config.angle ?? 0,
        arc: config.arc ?? Math.PI * 2,
        damage: config.damage,
        label: config.label,
        executeAt: nowSec + telegraph,
        executed: false
    });
    boss.telegraphUntil = nowSec + telegraph;
    const recovery = config.recovery ?? 1.8;
    boss.bossStateTimer = telegraph + recovery;
    boss.attackCooldown = nowSec + telegraph + recovery;
    boss.postAttackUntil = nowSec + telegraph + recovery + 1.2;
    boss.queuedAction = config.label;
}

function isInAttackZone(fx, px, py) {
    const dist = Math.hypot(px - fx.x, py - fx.y);
    let ad = Math.atan2(py - fx.y, px - fx.x) - fx.angle;
    while (ad > Math.PI) ad -= Math.PI * 2;
    while (ad < -Math.PI) ad += Math.PI * 2;
    const inArc = fx.arc >= Math.PI * 1.9 || Math.abs(ad) <= fx.arc / 2;
    return dist <= fx.radius && inArc;
}

function updateAttackZones(nowSec) {
    for (const fx of state.effects) {
        if (fx.executed || nowSec < fx.executeAt) continue;
        if (fx.type !== "bossZone" && fx.type !== "enemyZone" && fx.type !== "playerAttack") continue;
        fx.executed = true;
        if (fx.type === "playerAttack") {
            for (const enemy of [...state.entities, ...state.bosses]) {
                if (isInAttackZone(fx, enemy.x, enemy.y)) damageTarget(enemy, fx.damage, "player", nowSec);
            }
            for (const node of state.resources) {
                if (fx.gather && isInAttackZone(fx, node.x, node.y)) {
                    node.hp -= RESOURCE_GATHER_DAMAGE;
                    player.inventory[node.type] += 1;
                    if (node.hp <= 0) {
                        const quantity = Math.round(40 * RESOURCE_DROP_RATE[node.type]);
                        player.inventory[node.type] += quantity;
                        gainXp(node.type === "gold" ? 10 : 5);
                        const deadType = node.type;
                        state.resources = state.resources.filter((n) => n !== node);
                        queueResourceRespawn(deadType, nowSec);
                    }
                }
            }
            continue;
        }
        if (!isInAttackZone(fx, player.x, player.y)) continue;
        applyPlayerDamage(fx.label, fx.damage, nowSec);
        if (fx.label === "Super Wibuu") player.bleedUntil = nowSec + 6;
    }
}

function telegraphEnemyAttack(enemy, nowSec, config) {
    const telegraph = config.telegraph ?? 0.65;
    state.effects.push({
        type: "enemyZone",
        x: config.x,
        y: config.y,
        radius: config.radius,
        angle: config.angle ?? 0,
        arc: config.arc ?? Math.PI * 2,
        damage: config.damage,
        label: config.label,
        executeAt: nowSec + telegraph,
        executed: false
    });
    enemy.telegraphUntil = nowSec + telegraph;
    enemy.attackCooldown = nowSec + telegraph + 1.3;
}

function separateEntities() {
    const all = [...state.entities, ...state.bosses];
    for (let i = 0; i < all.length; i += 1) {
        for (let j = i + 1; j < all.length; j += 1) {
            const a = all[i];
            const b = all[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const minDist = a.radius + b.radius + 6;
            if (dist >= minDist) continue;
            const push = (minDist - dist) / 2;
            a.x -= (dx / dist) * push;
            a.y -= (dy / dist) * push;
            b.x += (dx / dist) * push;
            b.y += (dy / dist) * push;
        }
    }
}

function zonePoint(type) {
    const biomeFor = { wood: "forest", stone: "stoneField", gold: "lake" };
    const targetBiome = biomeFor[type];
    const minSpacing = type === "gold" ? 90 : type === "stone" ? 80 : 95;
    for (let attempt = 0; attempt < 50; attempt += 1) {
        const cell = Math.floor(randIn(-18, 18));
        const cellY = Math.floor(randIn(-18, 18));
        const cx = cell * RESOURCE_GRID + randIn(40, RESOURCE_GRID - 40);
        const cy = cellY * RESOURCE_GRID + randIn(40, RESOURCE_GRID - 40);
        if (Math.abs(cx) > HALF_WORLD - 120 || Math.abs(cy) > HALF_WORLD - 120) continue;
        if (getBiomeAt(cx, cy) !== targetBiome) continue;
        if (hasNearbyNode(cx, cy, minSpacing)) continue;
        if (Math.hypot(cx - player.x, cy - player.y) < 140) continue;
        return { x: cx, y: cy };
    }
    const angle = randIn(0, Math.PI * 2);
    if (type === "gold") {
        const radius = randIn(50, LAKE_RADIUS - 30);
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }
    const radius = randIn(FOREST_START + 200, HALF_WORLD - 150);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
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
            if (!hasNearbyNode(x, y, 88) && Math.hypot(x - player.x, y - player.y) > 180) break;
        }
    }
    const radius = getResourceRadius(type);
    const collRadius = radius * 0.68;
    return { type, x, y, hp: RESOURCE_NODE_HP, radius, collRadius };
}

function countResourcesByType() {
    const counts = { wood: 0, stone: 0, gold: 0 };
    for (const node of state.resources) counts[node.type] += 1;
    return counts;
}

function queueResourceRespawn(type, nowSec) {
    state.resourceRespawnQueue.push({ type, respawnAt: nowSec + RESOURCE_RESPAWN_SEC });
}

function processResourceRespawns(nowSec) {
    const counts = countResourcesByType();
    const pending = [];
    for (const entry of state.resourceRespawnQueue) {
        if (nowSec < entry.respawnAt) {
            pending.push(entry);
            continue;
        }
        if (counts[entry.type] >= RESOURCE_LIMITS[entry.type]) continue;
        state.resources.push(generateResource(entry.type));
        counts[entry.type] += 1;
    }
    state.resourceRespawnQueue = pending;
}

function fillResourcesToLimit() {
    const counts = countResourcesByType();
    for (const type of Object.keys(RESOURCE_LIMITS)) {
        while (counts[type] < RESOURCE_LIMITS[type]) {
            state.resources.push(generateResource(type));
            counts[type] += 1;
        }
    }
}

function purgeResourcesFromWrongBiomes() {
    state.resources = state.resources.filter((node) => {
        const biome = getBiomeAt(node.x, node.y);
        if (node.type === "gold") return biome === "lake";
        if (node.type === "stone") return biome === "stoneField";
        return biome === "forest";
    });
}

function ensureStarterResources() {
    const nearPlayer = state.resources.filter((n) => Math.hypot(n.x - player.x, n.y - player.y) < 320);
    const woodNear = nearPlayer.filter((n) => n.type === "wood").length;
    const stoneNear = nearPlayer.filter((n) => n.type === "stone").length;
    if (woodNear < 3) {
        for (let i = woodNear; i < 3; i += 1) {
            const r = getResourceRadius("wood");
            state.resources.push({ type: "wood", x: player.x + randIn(-220, 220), y: player.y + randIn(-220, 220), hp: RESOURCE_NODE_HP, radius: r, collRadius: r * 0.68 });
        }
    }
    if (stoneNear < 2) {
        for (let i = stoneNear; i < 2; i += 1) {
            const r = getResourceRadius("stone");
            state.resources.push({ type: "stone", x: player.x + randIn(-240, 240), y: player.y + randIn(-240, 240), hp: RESOURCE_NODE_HP, radius: r, collRadius: r * 0.68 });
        }
    }
}

function spawnBossInLake(nowSec) {
    for (let i = 0; i < 40; i += 1) {
        const angle = randIn(0, Math.PI * 2);
        const radius = randIn(90, LAKE_RADIUS - 70);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (Math.hypot(x - player.x, y - player.y) < SPAWN_SAFE_RADIUS) continue;
        spawnEnemy("boss", nowSec, x, y);
        return;
    }
    const angle = randIn(0, Math.PI * 2);
    spawnEnemy("boss", nowSec, Math.cos(angle) * 200, Math.sin(angle) * 200);
}

function summonBossAndPauseAutoSpawn(nowSec) {
    state.bossAutoSpawnPaused = true;
    state.bossSpawnTimer = BOSS_SPAWN_DELAY;
    if (state.bosses.length > 0) {
        addLog("Elite boss already active.");
        return;
    }
    spawnBossInLake(nowSec);
    addLog("Elite boss summoned in the lake. Auto-spawn paused (` again to allow).");
}

function spawnEnemy(type = "raider", nowSec = performance.now() / 1000, forcedX, forcedY) {
    const p = HALF_WORLD - 120;
    let x = forcedX;
    let y = forcedY;
    if (x === undefined || y === undefined) {
        for (let i = 0; i < 30; i += 1) {
            const side = Math.floor(Math.random() * 4);
            x = side === 0 ? -p : side === 1 ? p : randIn(-p, p);
            y = side === 2 ? -p : side === 3 ? p : randIn(-p, p);
            if (Math.hypot(x - player.x, y - player.y) > SPAWN_SAFE_RADIUS) break;
        }
    }
    const e = {
        id: crypto.randomUUID(),
        type,
        x,
        y,
        radius: type === "boss" ? 32 : 16,
        level: type === "boss" ? Math.max(4, player.level + 1) : Math.max(1, player.level - 1 + Math.floor(Math.random() * 2)),
        hp: type === "boss" ? randIn(1400, 1700) : 90 + Math.random() * 40,
        maxHp: type === "boss" ? 1700 : 130,
        speed: type === "boss" ? 4.2 : 7.1,
        baseAtk: type === "boss" ? 16 : 4.2,
        def: type === "boss" ? 14 : 2,
        attackCooldown: 0,
        burnUntil: 0,
        burnTickAt: 0,
        bossPhase: 1,
        bossStateTimer: 0,
        telegraphUntil: 0,
        dashCd: 0,
        dashUntil: 0,
        dashDirX: 0,
        dashDirY: 0,
        dashMoved: 0,
        dashHit: false,
        dashMaxDist: 150,
        postAttackUntil: 0,
        touchRestUntil: 0,
        contactCd: 0,
        queuedAction: null,
        lastDamager: null,
        damageMap: {},
        clanId: null
    };
    if (type === "boss") addLog("Elite boss spawned in the lake");
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
    player.attackCooldown = nowSec + data.atkSpeed * getAttackSpeedMult(equipped.id);
    if (equipped.id === "spear") player.spearReturnTimer = nowSec + data.returnCooldown;
    player.swingUntil = nowSec + 0.16;
    player.swingDirection *= -1;

    const stats = computeStats(player, nowSec);
    const damage = getWeaponDamage(equipped, stats.atk / 5);
    const rangePx = data.range * 32 * 1.35;
    const arc = equipped.id === "shovel" ? Math.PI * 0.55 : Math.PI * 0.85;
    state.effects.push({
        type: "playerAttack",
        x: player.x,
        y: player.y,
        angle: player.angle,
        radius: rangePx,
        arc,
        damage,
        gather: equipped.id === "shovel",
        executeAt: nowSec + 0.04,
        until: nowSec + 0.38,
        executed: false
    });
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
        { id: "shockWave", key: "Q", label: "Shock", color: "#52c7ff", tex: "skillShock" },
        { id: "fireShot", key: "E", label: "Fire", color: "#ff9440", tex: "skillFire" },
        { id: "targetMagnet", key: "F", label: "Magnet", color: "#d57cff", tex: "skillMagnet" },
        { id: "berserker", key: "V", label: "Berserk", color: "#ff5e5e", tex: "skillBerserk" }
    ];
}

function getMinimapLayout() {
    const mapW = 190;
    const mapH = 190;
    return {
        x: canvas.width - mapW - 16,
        y: canvas.height - mapH - 16,
        w: mapW,
        h: mapH
    };
}

function drawWorldBoundsOverlay() {
    const tl = worldToScreen(-HALF_WORLD, -HALF_WORLD);
    const br = worldToScreen(HALF_WORLD, HALF_WORLD);
    const left = Math.min(tl.x, br.x);
    const right = Math.max(tl.x, br.x);
    const top = Math.min(tl.y, br.y);
    const bottom = Math.max(tl.y, br.y);
    const voidTex = textures.voidTile;

    ctx.fillStyle = "rgba(4, 6, 14, 0.82)";
    if (top > 0) ctx.fillRect(0, 0, canvas.width, top);
    if (bottom < canvas.height) ctx.fillRect(0, bottom, canvas.width, canvas.height - bottom);
    if (left > 0) ctx.fillRect(0, top, left, bottom - top);
    if (right < canvas.width) ctx.fillRect(right, top, canvas.width - right, bottom - top);

    const borderTex = textures.borderTile;
    const bw = right - left;
    const bh = bottom - top;
    if (borderTex?.loaded) {
        const edge = 24;
        ctx.save();
        ctx.strokeStyle = "#c9a227";
        for (let t = 0; t < bw; t += edge) {
            ctx.drawImage(borderTex.img, left + t, top - edge, edge, edge);
            ctx.drawImage(borderTex.img, left + t, bottom, edge, edge);
        }
        for (let t = 0; t < bh; t += edge) {
            ctx.drawImage(borderTex.img, left - edge, top + t, edge, edge);
            ctx.drawImage(borderTex.img, right, top + t, edge, edge);
        }
        ctx.restore();
    }

    ctx.strokeStyle = "#e8c547";
    ctx.lineWidth = 5;
    ctx.shadowColor = "rgba(232, 197, 71, 0.55)";
    ctx.shadowBlur = 12;
    ctx.strokeRect(left, top, bw, bh);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.strokeRect(left + 3, top + 3, bw - 6, bh - 6);
}

function tryCraftWeapon(id) {
    const recipe = CRAFT_RECIPES[id];
    if (!recipe) return;
    if (WEAPON_DATA[id]?.gatherOnly) {
        addLog("Shovel is starter only");
        return;
    }
    if (getCraftableWeaponCount() >= 2) {
        addLog("No free weapon slot (max 2 combat weapons)");
        return;
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
    const nx = player.x + (dx / mag) * 210;
    const ny = player.y + (dy / mag) * 210;
    movePlayerWithCollision(nx, ny);
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
    const nx = player.x + (dx / mag) * stats.speed * 16 * dt;
    const ny = player.y + (dy / mag) * stats.speed * 16 * dt;
    movePlayerWithCollision(nx, ny);
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
        returnToMenu();
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
            if (enemy.telegraphUntil > nowSec) {
                // hold position while telegraphing
            } else if (enemy.chasing) {
                const nx = enemy.x + (dx / dist) * enemy.speed * 16 * dt;
                const ny = enemy.y + (dy / dist) * enemy.speed * 16 * dt;
                moveEntityWithCollision(enemy, nx, ny, enemy.radius);
            }
            const aim = Math.atan2(dy, dx);
            if (enemy.chasing && dist <= RAIDER_ATTACK_RANGE && enemy.attackCooldown < nowSec && (enemy.telegraphUntil || 0) < nowSec) {
                const dmg = Math.max(1, enemy.baseAtk - computeStats(player, nowSec).def * 0.2);
                telegraphEnemyAttack(enemy, nowSec, {
                    x: enemy.x,
                    y: enemy.y,
                    radius: 58,
                    angle: aim,
                    arc: Math.PI * 0.55,
                    damage: dmg,
                    label: "Raider Strike",
                    telegraph: 0.65
                });
            }
        }

        if (enemy.burnUntil > nowSec && nowSec >= enemy.burnTickAt) {
            enemy.burnTickAt = nowSec + SKILL_DATA.fireShot.burnTick;
            damageTarget(enemy, SKILL_DATA.fireShot.burnDmg, "player", nowSec);
        }
    }
    separateEntities();
}

function bossCanMove(boss, nowSec) {
    return (boss.touchRestUntil || 0) <= nowSec && (boss.telegraphUntil || 0) <= nowSec;
}

function bossApproach(boss, dx, dy, dist, dt, nowSec, rateMult = 1) {
    if (!bossCanMove(boss, nowSec) || dist > BOSS_LEASH_RANGE) return;
    const touch = getBossTouchRange(boss);
    if (dist <= touch) return;
    const step = Math.min(boss.speed * 15 * dt * rateMult, dist - touch + 2);
    if (step <= 0) return;
    moveBoss(boss, boss.x + (dx / dist) * step, boss.y + (dy / dist) * step);
    clampToWorld(boss);
}

function updateBossGradualDash(boss, dt, nowSec) {
    if (!boss.dashUntil || nowSec >= boss.dashUntil) {
        boss.dashUntil = 0;
        boss.dashHit = false;
        return false;
    }
    if (isBossTouchingPlayer(boss)) {
        boss.dashUntil = 0;
        bossEngageOnContact(boss, nowSec, Math.atan2(player.y - boss.y, player.x - boss.x));
        return true;
    }
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const step = BOSS_DASH_SPEED * dt;
    moveBoss(boss, boss.x + (dx / dist) * step, boss.y + (dy / dist) * step);
    clampToWorld(boss);
    return true;
}

function startBossDash(boss, dist, nowSec) {
    if (dist < BOSS_DASH_MIN_RANGE || dist > BOSS_DASH_MAX_RANGE) return false;
    boss.dashCd = nowSec + BOSS_DASH_CD;
    boss.dashUntil = nowSec + BOSS_DASH_DURATION;
    boss.dashHit = false;
    boss.dashMaxDist = Math.min(150, dist - 20);
    return true;
}

function runBossBrain(boss, dt, nowSec, dx, dy, dist) {
    boss.bossPhase = boss.hp <= boss.maxHp * 0.5 ? 2 : 1;
    const aim = Math.atan2(dy, dx);

    if (dist > BOSS_LEASH_RANGE) return;

    if (isBossTouchingPlayer(boss) && (boss.touchRestUntil || 0) <= nowSec && (boss.contactCd || 0) <= nowSec) {
        bossEngageOnContact(boss, nowSec, aim);
    }

    if ((boss.touchRestUntil || 0) > nowSec) {
        if (boss.telegraphUntil > nowSec) return;
        return;
    }

    if (updateBossGradualDash(boss, dt, nowSec)) return;

    if (boss.telegraphUntil > nowSec) return;

    const recovering = boss.bossStateTimer > 0;
    if (recovering) {
        boss.bossStateTimer = Math.max(0, boss.bossStateTimer - dt);
        return;
    }

    if ((boss.attackCooldown || 0) > nowSec) return;

    if (dist > BOSS_ATTACK_RANGE) {
        bossApproach(boss, dx, dy, dist, dt, nowSec);
        return;
    }

    if (isBossTouchingPlayer(boss)) {
        bossEngageOnContact(boss, nowSec, aim);
        return;
    }

    if (dist > BOSS_KITE_MIN && dist < BOSS_KITE_MAX && (boss.ruptureCd || 0) < nowSec) {
        boss.ruptureCd = nowSec + 10;
        telegraphBossAttack(boss, nowSec, {
            x: boss.x + Math.cos(aim) * 30,
            y: boss.y + Math.sin(aim) * 30,
            radius: 70,
            damage: 14,
            label: "Ground Rupture",
            telegraph: 1.15,
            recovery: 2.2
        });
        return;
    }

    if (!boss.actionIndex) boss.actionIndex = 0;
    const phase = boss.bossPhase;
    const p1 = ["slam", "rest", "spiritCone", "dashStrike", "rest"];
    const p2 = ["spiritExplode", "rest", "superWibuu", "berserker"];
    const action = (phase === 1 ? p1 : p2)[boss.actionIndex % (phase === 1 ? p1.length : p2.length)];
    boss.actionIndex += 1;
    const recovery = phase === 2 ? 2.0 : 2.4;

    if (action === "slam") {
        telegraphBossAttack(boss, nowSec, { x: boss.x, y: boss.y, radius: 68, damage: 24, label: "Heavy Slam", telegraph: 1.05, recovery });
    } else if (action === "dashStrike") {
        if ((boss.dashCd || 0) <= nowSec && !isBossTouchingPlayer(boss) && startBossDash(boss, dist, nowSec)) {
            boss.telegraphUntil = nowSec + 0.18;
        } else if (!isBossTouchingPlayer(boss)) {
            telegraphBossAttack(boss, nowSec, { x: boss.x, y: boss.y, radius: 68, damage: 20, label: "Heavy Slam", telegraph: 0.95, recovery });
        }
    } else if (action === "spiritCone") {
        telegraphBossAttack(boss, nowSec, {
            x: boss.x,
            y: boss.y,
            radius: 100,
            angle: aim,
            arc: Math.PI * 0.4,
            damage: 18,
            label: "Spirit Cone",
            telegraph: 1.0,
            recovery
        });
    } else if (action === "rest") {
        boss.bossStateTimer = 2.2;
        boss.attackCooldown = nowSec + 1.6;
    } else if (action === "superWibuu") {
        telegraphBossAttack(boss, nowSec, {
            x: boss.x + Math.cos(aim) * 25,
            y: boss.y + Math.sin(aim) * 25,
            radius: 88,
            damage: 20,
            label: "Super Wibuu",
            telegraph: 1.1,
            recovery
        });
    } else if (action === "spamCombo") {
        telegraphBossAttack(boss, nowSec, { x: boss.x, y: boss.y, radius: 78, damage: 21, label: "Combo Slam", telegraph: 0.95, recovery });
    } else if (action === "spiritExplode") {
        telegraphBossAttack(boss, nowSec, { x: boss.x, y: boss.y, radius: 105, damage: 17, label: "Spirit Explode", telegraph: 1.05, recovery });
    } else if (action === "berserker") {
        telegraphBossAttack(boss, nowSec, { x: boss.x, y: boss.y, radius: 72, damage: 23, label: "Berserker Hit", telegraph: 0.9, recovery });
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
        .filter((e) => {
            if (e.type === "bossZone" || e.type === "enemyZone") return !e.executed || nowSec < e.executeAt + 0.25;
            if (e.type === "playerAttack") return nowSec < (e.until || e.executeAt + 0.4);
            return e.until > nowSec;
        });
    state.floatingText = state.floatingText
        .map((t) => ({ ...t, y: t.y - 18 * dt, ttl: t.ttl - dt }))
        .filter((t) => t.ttl > 0);
}

function spawnLoop(dt, nowSec) {
    state.spawnTimer -= dt;
    state.bossSpawnTimer -= dt;
    const difficulty = Math.min(1.7, 0.85 + player.level * 0.08 + nowSec / 300);
    if (state.spawnTimer <= 0) {
        state.spawnTimer = Math.max(0.7, 2.1 / difficulty);
        if (state.entities.length < 14 + Math.floor(player.level * 1.1)) spawnEnemy("raider", nowSec);
    }
    if (!state.bossAutoSpawnPaused && state.bossSpawnTimer <= 0 && state.bosses.length < 1) {
        state.bossSpawnTimer = BOSS_SPAWN_DELAY;
        spawnBossInLake(nowSec);
    }
}

function drawEntityHealthBar(screenX, screenY, hp, maxHp, barW, offsetY) {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const h = 6;
    const y = screenY + offsetY;
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fillRect(screenX - barW / 2, y, barW, h);
    ctx.fillStyle = ratio > 0.35 ? "#e74c3c" : "#8b0000";
    ctx.fillRect(screenX - barW / 2, y, barW * ratio, h);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - barW / 2, y, barW, h);
}

function update(dt, nowSec) {
    if (!running) return;
    processResourceRespawns(nowSec);
    updatePlayer(dt, nowSec);
    updateEntities(dt, nowSec);
    updateProjectiles(dt, nowSec);
    updateAttackZones(nowSec);
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
    drawWorldBoundsOverlay();

    for (const node of state.resources) {
        const p = worldToScreen(node.x, node.y);
        const tex = node.type === "wood" ? "woodNode" : node.type === "stone" ? "stoneNode" : "goldNode";
        const nodeSize = node.radius * 2.15 * CAMERA_ZOOM;
        drawSpriteOrFallback(tex, p.x, p.y, nodeSize, nodeSize, node.type === "wood" ? "#4d7c38" : node.type === "stone" ? "#8b929e" : "#d4af37");
        const hpRatio = Math.max(0, node.hp / RESOURCE_NODE_HP);
        const barW = node.radius * 1.4;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(p.x - barW, p.y + node.radius * 0.75, barW * 2, 5);
        ctx.fillStyle = "#7CFFB8";
        ctx.fillRect(p.x - barW, p.y + node.radius * 0.75, barW * 2 * hpRatio, 5);
    }

    for (const enemy of state.entities) {
        const p = worldToScreen(enemy.x, enemy.y);
        const size = enemy.radius * 2 * CAMERA_ZOOM;
        drawSpriteOrFallback("raider", p.x, p.y, size, size, "#c54848");
        drawEntityHealthBar(p.x, p.y, enemy.hp, enemy.maxHp, Math.max(36, size * 0.9), -size * 0.55);
    }
    for (const boss of state.bosses) {
        const p = worldToScreen(boss.x, boss.y);
        const size = boss.radius * 2.1 * CAMERA_ZOOM;
        drawSpriteOrFallback(boss.bossPhase === 1 ? "bossP1" : "bossP2", p.x, p.y, size, size, "#8227c7");
        drawEntityHealthBar(p.x, p.y, boss.hp, boss.maxHp, Math.max(64, size * 1.1), -size * 0.52);
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

    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const barW = 44;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(me.x - barW / 2, me.y + player.radius * CAMERA_ZOOM + 8, barW, 6);
    ctx.fillStyle = hpRatio > 0.35 ? "#e74c3c" : "#8b0000";
    ctx.fillRect(me.x - barW / 2, me.y + player.radius * CAMERA_ZOOM + 8, barW * hpRatio, 6);

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
            const arcR = Math.min(70, fx.range * 0.35 * CAMERA_ZOOM);
            const arcTex = textures.attackArc;
            if (arcTex?.loaded) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(fx.angle);
                ctx.globalAlpha = 0.85;
                ctx.drawImage(arcTex.img, -arcR, -arcR * 0.5, arcR * 2, arcR);
                ctx.globalAlpha = 1;
                ctx.restore();
            } else {
                ctx.strokeStyle = "#ffef9f";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, arcR, fx.angle - 0.32, fx.angle + 0.32);
                ctx.stroke();
            }
        } else if (fx.type === "bossZone" || fx.type === "enemyZone") {
            const r = fx.radius * CAMERA_ZOOM;
            const pulse = 0.45 + 0.25 * Math.sin(performance.now() / 120);
            const isEnemy = fx.type === "enemyZone";
            const warnTex = !isEnemy ? textures.bossSlamWarn : null;
            if (warnTex?.loaded) {
                ctx.globalAlpha = pulse * 0.9;
                ctx.drawImage(warnTex.img, p.x - r, p.y - r, r * 2, r * 2);
                ctx.globalAlpha = 1;
            }
            ctx.fillStyle = isEnemy ? `rgba(255, 120, 60, ${pulse * 0.35})` : `rgba(255, 60, 40, ${pulse * 0.35})`;
            ctx.beginPath();
            if (fx.arc >= Math.PI * 1.9) {
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            } else {
                ctx.moveTo(p.x, p.y);
                ctx.arc(p.x, p.y, r, fx.angle - fx.arc / 2, fx.angle + fx.arc / 2);
                ctx.closePath();
            }
            ctx.fill();
            ctx.strokeStyle = isEnemy ? "rgba(255, 180, 100, 0.9)" : "rgba(255, 200, 120, 0.9)";
            ctx.lineWidth = 2;
            ctx.stroke();
            if (fx.label) {
                ctx.fillStyle = "#ffe8a0";
                ctx.font = "12px Arial";
                ctx.fillText(fx.label, p.x - 36, p.y - r - 6);
            }
        } else if (fx.type === "playerAttack") {
            const r = fx.radius * CAMERA_ZOOM;
            ctx.fillStyle = "rgba(120, 220, 255, 0.28)";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, r, fx.angle - fx.arc / 2, fx.angle + fx.arc / 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(180, 240, 255, 0.95)";
            ctx.lineWidth = 2;
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

    drawGameUi(nowSec);
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

function drawGameUi(nowSec) {
    if (uiVisibility.stats || uiVisibility.actionBar || uiVisibility.armorSlots) drawBottomCenterHud(nowSec);
    if (uiVisibility.minimap) {
        drawInventoryAboveMinimap();
        drawMiniMap();
    }
    if (uiVisibility.leaderboard) drawLeaderboardHud();
}

function drawInventoryAboveMinimap() {
    const map = getMinimapLayout();
    const panelW = map.w;
    const panelH = 72;
    const panelX = map.x;
    const panelY = map.y - panelH - 8;
    const tex = textures.inventoryPanel;
    if (tex?.loaded) ctx.drawImage(tex.img, panelX, panelY, panelW, panelH);
    else drawHudPanel(panelX, panelY, panelW, panelH);
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText("Inventory", panelX + 10, panelY + 18);
    ctx.font = "11px Arial";
    ctx.fillText(`Wood ${player.inventory.wood}`, panelX + 10, panelY + 38);
    ctx.fillText(`Stone ${player.inventory.stone}`, panelX + 10, panelY + 54);
    ctx.fillText(`Gold ${player.inventory.gold}  UE ${player.inventory.ultimateEssence}`, panelX + 100, panelY + 38);
}

function drawBottomCenterHud(nowSec) {
    const stats = computeStats(player, nowSec);
    const slotW = 54;
    const slotH = 54;
    const rowY = canvas.height - slotH - 12;
    const xpReq = getLevelRequirement(player.level);
    const xpRatio = Math.min(1, player.xp / xpReq);

    if (uiVisibility.stats) {
        const panelW = 210;
        const panelH = 124;
        const panelX = 12;
        const panelY = canvas.height - panelH - 12;
        drawHudPanel(panelX, panelY, panelW, panelH);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.fillText(playerName, panelX + 10, panelY + 20);
        ctx.fillText(`Lv ${player.level}  XP ${Math.floor(player.xp)}/${xpReq}`, panelX + 10, panelY + 36);
        ctx.fillStyle = "rgba(25,25,25,0.92)";
        ctx.fillRect(panelX + 10, panelY + 42, panelW - 20, 10);
        ctx.fillStyle = "#4da3ff";
        ctx.fillRect(panelX + 10, panelY + 42, (panelW - 20) * xpRatio, 10);
        ctx.fillText(`HP ${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}`, panelX + 10, panelY + 68);
        ctx.fillText(`ATK ${stats.atk.toFixed(1)}  DEF ${stats.def.toFixed(1)}`, panelX + 10, panelY + 84);
        ctx.fillText(`Score ${state.score.toFixed(0)}`, panelX + 10, panelY + 100);
    }

    if (uiVisibility.armorSlots) {
        const panelH = 124;
        const panelY = canvas.height - panelH - 12;
        const armorX = 228;
        const armorY = panelY + panelH - slotH - 8;
        const tier = ARMOR_TIERS[player.armor.tierIndex];
        drawHudPanel(armorX - 4, armorY - 4, slotW * 2 + 16, slotH + 8);
        ctx.fillStyle = "#fff";
        ctx.font = "10px Arial";
        ctx.fillText(tier, armorX, armorY - 2);
        ctx.fillStyle = player.armor.helmet ? "rgba(70,110,170,0.85)" : "rgba(35,35,35,0.88)";
        ctx.fillRect(armorX, armorY, slotW, slotH);
        ctx.strokeStyle = "#ccc";
        ctx.strokeRect(armorX, armorY, slotW, slotH);
        ctx.fillStyle = player.armor.wings ? "rgba(130,80,170,0.85)" : "rgba(35,35,35,0.88)";
        ctx.fillRect(armorX + slotW + 8, armorY, slotW, slotH);
        ctx.strokeRect(armorX + slotW + 8, armorY, slotW, slotH);
    }

    if (uiVisibility.actionBar) {
        const skills = getSkillUiList();
        const gap = 6;
        const craftW = 110;
        const totalW = slotW * 3 + gap * 3 + skills.length * (slotW + gap) + craftW + 8;
        const startX = canvas.width / 2 - totalW / 2;
        drawCenterActionBars(nowSec, rowY, startX);
    }
}

function drawCenterActionBars(nowSec, baseY, startX) {
    const slotW = 54;
    const slotH = 54;
    const slotLabels = [{ slot: 1 }, { slot: 2 }, { slot: 3 }];
    let x = startX;
    for (let i = 0; i < slotLabels.length; i += 1) {
        const slotWeapon = getWeaponBySlot(slotLabels[i].slot);
        const isActive = slotWeapon && slotWeapon === getCurrentWeapon();
        ctx.fillStyle = isActive ? "rgba(170,130,42,0.9)" : "rgba(25,25,25,0.82)";
        ctx.fillRect(x, baseY, slotW, slotH);
        ctx.strokeStyle = "#cfcfcf";
        ctx.strokeRect(x, baseY, slotW, slotH);
        ctx.fillStyle = "#fff";
        ctx.font = "11px Arial";
        ctx.fillText(String(slotLabels[i].slot), x + 4, baseY + 12);
        if (slotWeapon) {
            const icon = getWeaponTextureKey(slotWeapon.id);
            if (icon) drawSpriteOrFallback(icon, x + slotW / 2, baseY + slotH / 2, 32, 32, "#ddd");
        }
        x += slotW + 6;
    }

    const skills = getSkillUiList();
    for (let i = 0; i < skills.length; i += 1) {
        const s = skills[i];
        ctx.fillStyle = "rgba(25,25,25,0.84)";
        ctx.fillRect(x, baseY, slotW, slotH);
        ctx.strokeStyle = "#b7b7b7";
        ctx.strokeRect(x, baseY, slotW, slotH);
        ctx.fillStyle = "#fff";
        ctx.font = "11px Arial";
        ctx.fillText(s.key, x + 4, baseY + 12);
        if (s.tex && textures[s.tex]?.loaded) {
            drawSpriteOrFallback(s.tex, x + slotW / 2, baseY + slotH / 2 + 2, 34, 34, s.color);
        } else {
            ctx.fillStyle = s.color;
            ctx.fillRect(x + 12, baseY + 18, 34, 24);
        }
        const remain = Math.max(0, player.skillCd[s.id] - nowSec);
        if (remain > 0) {
            const ratio = Math.min(1, remain / SKILL_DATA[s.id].cd);
            ctx.fillStyle = "rgba(0,0,0,0.62)";
            ctx.fillRect(x, baseY, slotW, slotH * ratio);
            ctx.fillStyle = "#fff";
            ctx.font = "12px Arial";
            ctx.fillText(remain.toFixed(0), x + slotW / 2 - 6, baseY + slotH / 2 + 4);
        }
        x += slotW + 6;
    }

    state.craftUi.toggleButton = { x: x + 8, y: baseY + 12, w: 110, h: 34 };
    ctx.fillStyle = state.craftUi.open ? "rgba(120,76,26,0.95)" : "rgba(36,78,122,0.95)";
    ctx.fillRect(state.craftUi.toggleButton.x, state.craftUi.toggleButton.y, state.craftUi.toggleButton.w, state.craftUi.toggleButton.h);
    ctx.strokeStyle = "#ddd";
    ctx.strokeRect(state.craftUi.toggleButton.x, state.craftUi.toggleButton.y, state.craftUi.toggleButton.w, state.craftUi.toggleButton.h);
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText("Craft [P]", state.craftUi.toggleButton.x + 18, state.craftUi.toggleButton.y + 22);
}

function drawLeaderboardHud() {
    drawHudPanel(canvas.width - 248, 10, 236, 200);
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText("Leaderboard", canvas.width - 230, 32);
    state.leaderboard.slice(0, 8).forEach((entry, i) => {
        ctx.font = "12px Arial";
        ctx.fillText(`${i + 1}. ${entry.name} - ${entry.score}`, canvas.width - 230, 52 + i * 18);
    });
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
    const layout = getMinimapLayout();
    const { x, y, w: mapW, h: mapH } = layout;
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
    if (key === "`" && e.shiftKey) {
        e.preventDefault();
        state.bossAutoSpawnPaused = false;
        state.bossSpawnTimer = BOSS_SPAWN_DELAY;
        addLog("Elite boss auto-spawn re-enabled (Shift+`).");
    } else if (key === "`") {
        e.preventDefault();
        summonBossAndPauseAutoSpawn(nowSec);
    }
    if (key === "f1") { e.preventDefault(); uiVisibility.stats = !uiVisibility.stats; }
    if (key === "f2") { e.preventDefault(); uiVisibility.actionBar = !uiVisibility.actionBar; }
    if (key === "f3") { e.preventDefault(); uiVisibility.armorSlots = !uiVisibility.armorSlots; }
    if (key === "f4") { e.preventDefault(); uiVisibility.minimap = !uiVisibility.minimap; }
    if (key === "f5") { e.preventDefault(); uiVisibility.leaderboard = !uiVisibility.leaderboard; }
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
    Object.assign(player, createPlayer());
    state.score = 0;
    state.entities = [];
    state.bosses = [];
    state.resources = [];
    state.projectiles = [];
    state.effects = [];
    document.querySelector(".menu").style.display = "none";
    canvas.style.display = "block";
    running = true;
    preloadTextures();
    state.resourceRespawnQueue = [];
    state.bossAutoSpawnPaused = false;
    purgeResourcesFromWrongBiomes();
    fillResourcesToLimit();
    ensureStarterResources();
    const spawn = findSafePlayerSpawn();
    player.x = spawn.x;
    player.y = spawn.y;
    player.buffs.spawnProtectionUntil = performance.now() / 1000 + 4;
    state.spawnTimer = 0.35;
    state.bossSpawnTimer = BOSS_SPAWN_DELAY;
    for (let i = 0; i < 2; i += 1) spawnEnemy("raider");
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

requestAnimationFrame(gameLoop);