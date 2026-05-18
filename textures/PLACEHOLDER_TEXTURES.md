# Placeholder Texture List

Use this list as drop-in temporary assets. The game already loads these paths and falls back safely if missing.

## Terrain
- `textures/terrain/grass_tile.png` (128x128)
- `textures/terrain/dirt_tile.png` (128x128)
- `textures/terrain/stone_tile.png` (128x128)
- `textures/terrain/lake_water_tile.png` (128x128)
- `textures/terrain/void_tile.png` (128x128) — dark wasteland outside the playable border
- `textures/terrain/world_border_tile.png` (64x64) — gold/stone edge tile for map boundary

## Resources
- `textures/resources/tree_node.png` (64x64)
- `textures/resources/stone_node.png` (64x64)
- `textures/resources/gold_node.png` (64x64)

## Pickups (drops / UI flair)
- `textures/pickups/wood_drop.png` (32x32)
- `textures/pickups/stone_drop.png` (32x32)
- `textures/pickups/gold_drop.png` (32x32)

## Player
- `textures/player/player_idle.png` (64x64)
- `textures/player/player_berserk.png` (64x64)
- `textures/player/player_walk_1.png` (64x64) — optional walk cycle frame 1
- `textures/player/player_walk_2.png` (64x64) — optional walk cycle frame 2

## Enemies
- `textures/enemies/raider.png` (64x64)
- `textures/enemies/raider_elite.png` (64x64) — tougher variant tint
- `textures/enemies/elite_boss_phase1.png` (96x96)
- `textures/enemies/elite_boss_phase2.png` (96x96)

## Weapons
- `textures/weapons/shovel.png` (48x48)
- `textures/weapons/dagger.png` (48x48)
- `textures/weapons/sword.png` (48x48)
- `textures/weapons/long_sword.png` (48x48)
- `textures/weapons/spear.png` (48x48)
- `textures/weapons/axe.png` (48x48)

## VFX
- `textures/vfx/fire_shot.png` (32x32)
- `textures/vfx/shock_wave_ring.png` (128x128)
- `textures/vfx/attack_arc_slash.png` (96x64) — player melee swing arc
- `textures/vfx/boss_slam_warning.png` (128x128) — red/orange telegraph circle for boss
- `textures/vfx/resource_gather_spark.png` (48x48) — shovel hit on trees/rocks
- `textures/vfx/player_hit_spark.png` (48x48) — when player takes damage
- `textures/vfx/level_up_burst.png` (96x96) — optional level-up celebration
- `textures/vfx/death_poof.png` (64x64) — optional death effect

## UI
- `textures/ui/hud_panel.png` (512x256)
- `textures/ui/minimap_frame.png` (256x256)
- `textures/ui/inventory_panel.png` (256x96) — materials panel above minimap
- `textures/ui/skill_icon_shock.png` (48x48)
- `textures/ui/skill_icon_fire.png` (48x48)
- `textures/ui/skill_icon_magnet.png` (48x48)
- `textures/ui/skill_icon_berserk.png` (48x48)
- `textures/ui/skill_icons.png` (256x256, 4 icons) — legacy sheet; individual icons preferred

## Temporary Style Rules
- Top-down view for all entities.
- Single light source from top-left.
- Transparent PNG backgrounds.
- Keep saturation medium to avoid overpowering HUD text.
- Boss telegraphs: warm reds/oranges; player attacks: yellow-white; shock: cyan.
