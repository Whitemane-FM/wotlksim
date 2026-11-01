// wotlksim: tooltips for custom items and glyphs that don't exist on Wowhead.
//
// ActionId.makeItemUrl() returns a "#wotlksim-item-<id>" link for these IDs instead of a
// Wowhead URL, so Wowhead's script ignores them (no more "Item not found"). A single
// document-level hover handler shows our own tooltip for those links everywhere
// (gear slots, item lists, glyph picker, ...).

import variantEffects from '../../assets/db_inputs/wotlk_variant_effects.json';
import { getUpgradeChainBase, getUpgradeLevel, isUpgradeVersion } from './upgrades.js';

// Special effect lines (procs, use effects) of upgrade levels and epic versions, taken from
// their base item (or the Whitemane 2 export, with the scaled amounts). See tools/gen_variant_items.py.
const VARIANT_EFFECTS = variantEffects as Record<string, Array<string>>;

type Line = string | [string, string]; // text, or [left, right]

interface CustomTooltip {
	name: string;
	quality: 'legendary' | 'epic' | 'common';
	lines: Array<Line | { text: string; color: 'green' | 'gray' | 'yellow' | 'blue' } | { socket: string }>;
}

// A gem socket line: shows the socket icon, or the socketed gem when one is equipped.
const gem = (color: string) => ({ socket: color });
const green = (text: string) => ({ text, color: 'green' as const });

const STORMCOIL_PROC =
	'Chance on hit: Hurls a lightning bolt at the enemy, dealing 734 to 838 Nature damage and then jumping to additional nearby enemies. Each jump reduces the damage by 30%. Affects 3 total targets. (15 sec cooldown)';

const CUSTOM_TOOLTIPS: Record<number, CustomTooltip> = {
	128858: {
		name: 'Embersoul, Scythe of the Cat God',
		quality: 'legendary',
		lines: [
			'Item Level 245',
			'Binds when picked up',
			['Two-Hand', 'Polearm'],
			['761 - 1080 Damage', 'Speed 3.60'],
			'(255.7 damage per second)',
			'+130 Agility',
			'+142 Stamina',
			gem('Red'),
			{ text: 'Socket Bonus: +8 Agility', color: 'gray' },
			'Classes: Druid',
			'Requires Level 80',
			green('Increases attack power by 2812 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Increases attack power by 177.'),
			green('Equip: Improves critical strike rating by 98.'),
			green('Equip: Increases your armor penetration rating by 92.'),
			green('Equip: Your finishing moves restore 4 energy per combo point spent.'),
		],
	},
	130031: {
		name: 'Armata Strigoi',
		quality: 'legendary',
		lines: [
			'Item Level 232',
			'Binds when picked up',
			['Two-Hand', 'Axe'],
			['673 - 1008 Damage', 'Speed 3.60'],
			'(233.5 damage per second)',
			'+131 Strength',
			'+139 Stamina',
			gem('Red'),
			gem('Yellow'),
			{ text: 'Socket Bonus: +6 Strength', color: 'gray' },
			'Requires Level 80',
			green('Increases attack power by 2501 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Improves critical strike rating by 81.'),
			green('Equip: Increases your armor penetration rating by 64.'),
			green('Chance on hit: A forgotten soul is bound to your will. When 4 Forgotten Souls are accumulated, they will release, triggering an instant weapon attack.'),
		],
	},
	150005: {
		name: 'Stormcoil',
		quality: 'legendary',
		lines: [
			'Item Level 232',
			'Binds when picked up',
			'Unique',
			['Ranged', 'Gun'],
			['449 - 637 Damage', 'Speed 2.90'],
			'(187.2 damage per second)',
			'+38 Agility',
			'+38 Stamina',
			'Requires Level 80',
			green('Equip: Increases attack power by 50.'),
			green('Equip: Improves critical strike rating by 26.'),
			green('Equip: Improves haste rating by 23.'),
		],
	},
	131004: {
		name: 'Doomhammer',
		quality: 'legendary',
		lines: [
			'Item Level 245',
			'Binds when picked up',
			['Main Hand', 'Mace'],
			['357 - 666 Damage', 'Speed 2.60'],
			'(196.7 damage per second)',
			'+58 Stamina',
			'+58 Intellect',
			gem('Yellow'),
			{ text: 'Socket Bonus: +4 Critical Strike Rating', color: 'gray' },
			'Classes: Shaman',
			'Requires Level 80',
			green('Increases attack power by 1987 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Improves haste rating by 58.'),
			green('Equip: Improves critical strike rating by 39.'),
			green('Equip: Increases spell power by 621.'),
			green('Equip: Gives your Flame Shock periodic damage ticks a 20% chance to reset the cooldown of your Lava Burst spell and make it an instant cast.'),
		],
	},
	315007: {
		name: 'Nargaroth, Warden of the Dark Tower',
		quality: 'legendary',
		lines: [
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Two-Hand', 'Mace'],
			['812 - 1218 Damage', 'Speed 3.60'],
			'(281.9 damage per second)',
			'+139 Agility',
			'+172 Stamina',
			gem('Blue'),
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +8 Stamina', color: 'gray' },
			'Requires Level 80',
			green('Increases attack power by 3180 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Improves critical strike rating by 105.'),
			green('Equip: Improves hit rating by 95.'),
			green('Equip: Increases attack power by 192.'),
			green('Chance on hit (10%, 1 min cooldown): For 8 sec, reduces damage taken by 10% and deals 1200 Fire damage to nearby enemies every 1 sec. Every time it deals damage you gain 2 Runic Power or Rage.'),
		],
	},
	217741: {
		name: 'Fury of the Sunwell',
		quality: 'legendary',
		lines: [
			'Item Level 277',
			'Binds when picked up',
			['Off Hand', 'Shield'],
			'9263 Armor',
			'259 Block',
			'+103 Strength',
			'+144 Stamina',
			gem('Meta'),
			{ text: 'Socket Bonus: +6 Stamina', color: 'gray' },
			'Requires Level 80',
			green('Equip: Increases defense rating by 60.'),
			green('Equip: Increases your parry rating by 50.'),
			green('Equip: Increases the block value of your shield by 168.'),
			green("Equip: When you are attacked (40 sec cooldown), gain Sunwell's Protection, absorbing 2750 damage for 6 sec. When it expires or is breached, it erupts with Fury of the Sunwell, dealing 3950 Holy damage to nearby enemies."),
		],
	},
	315006: {
		name: 'Nightwing',
		quality: 'legendary',
		lines: [
			{ text: 'Heroic', color: 'green' },
			'Item Level 258',
			'Binds when picked up',
			['Two-Hand', 'Staff'],
			['258 - 347 Damage', 'Speed 2.60'],
			'(116.3 damage per second)',
			'+162 Stamina',
			'+162 Intellect',
			'+89 Spirit',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Priest, Mage, Warlock, Druid',
			'Requires Level 80',
			green('Increases attack power by 862 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Improves critical strike rating by 124.'),
			green('Equip: Improves haste rating by 124.'),
			green('Equip: Increases spell power by 701.'),
			green('Equip: Your offensive spell casts have a 10% chance to summon a raven for 10 sec (45 sec cooldown). The raven stores damage equal to 21% of your spell damage dealt, and unleashes it when it expires.'),
		],
	},
	150090: {
		name: 'Stormcoil',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 2/3', color: 'yellow' },
			'Item Level 245',
			'Binds when picked up',
			'Unique',
			['Ranged', 'Gun'],
			['465 - 772 Damage', 'Speed 2.90'],
			'(213.3 damage per second)',
			'+44 Agility',
			'+44 Stamina',
			gem('Red'),
			{ text: 'Socket Bonus: +8 Attack Power', color: 'gray' },
			'Requires Level 80',
			green('Equip: Increases attack power by 70.'),
			green('Equip: Improves critical strike rating by 43.'),
			green('Equip: Improves haste rating by 31.'),
			green(STORMCOIL_PROC),
		],
	},
	315005: {
		name: 'Stormcoil',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 3/3', color: 'yellow' },
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Ranged', 'Gun'],
			['590 - 809 Damage', 'Speed 2.90'],
			'(241.2 damage per second)',
			'+45 Agility',
			'+45 Stamina',
			gem('Red'),
			{ text: 'Socket Bonus: +8 Attack Power', color: 'gray' },
			'Requires Level 80',
			green('Equip: Increases attack power by 52.'),
			green('Equip: Improves critical strike rating by 37.'),
			green('Equip: Improves haste rating by 28.'),
			green(STORMCOIL_PROC),
		],
	},
	315008: {
		name: 'Doomhammer',
		quality: 'legendary',
		lines: [
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Main Hand', 'Mace'],
			['521 - 782 Damage', 'Speed 2.60'],
			'(250.6 damage per second)',
			'+62 Stamina',
			'+64 Intellect',
			gem('Yellow'),
			{ text: 'Socket Bonus: +4 Critical Strike Rating', color: 'gray' },
			'Classes: Shaman',
			'Requires Level 80',
			green('Increases attack power by 2741 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Improves haste rating by 55.'),
			green('Equip: Improves critical strike rating by 51.'),
			green('Equip: Increases spell power by 701.'),
			green('Equip: Gives your Flame Shock periodic damage ticks a 20% chance to reset the cooldown of your Lava Burst spell and make it an instant cast.'),
		],
	},
	315010: {
		name: 'Embersoul, Scythe of the Cat God',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 2/2', color: 'yellow' },
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Two-Hand', 'Polearm'],
			['811 - 1217 Damage', 'Speed 3.60'],
			'(281.7 damage per second)',
			'+155 Agility',
			'+139 Stamina',
			gem('Red'),
			gem('Red'),
			{ text: 'Socket Bonus: +12 Attack Power', color: 'gray' },
			'Classes: Druid',
			'Requires Level 80',
			green('Increases attack power by 3176 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Increases attack power by 190.'),
			green('Equip: Improves critical strike rating by 104.'),
			green('Equip: Increases your armor penetration rating by 99.'),
			green('Equip: Your finishing moves restore 4 energy per combo point spent.'),
		],
	},
	315004: {
		name: 'Armata Strigoi',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 2/2', color: 'yellow' },
			'Item Level 258',
			'Binds when picked up',
			['Two-Hand', 'Axe'],
			['811 - 1217 Damage', 'Speed 3.60'],
			'(281.7 damage per second)',
			'+160 Strength',
			'+183 Stamina',
			gem('Red'),
			gem('Yellow'),
			{ text: 'Socket Bonus: +6 Strength', color: 'gray' },
			'Requires Level 80',
			green('Increases attack power by 3176 in Cat, Bear, Dire Bear, and Moonkin forms only.'),
			green('Equip: Improves critical strike rating by 98.'),
			green('Equip: Increases your armor penetration rating by 101.'),
			green('Chance on hit: A forgotten soul is bound to your will. When 4 Forgotten Souls are accumulated, they will release, triggering an instant weapon attack.'),
		],
	},
	132005: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			'Item Level 232',
			'Binds when picked up',
			['Two-Hand', 'Staff'],
			['231 - 427 Damage', 'Speed 2.10'],
			'(156.7 damage per second)',
			'+108 Stamina',
			'+128 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Priest',
			'Requires Level 80',
			green('Equip: Improves critical strike rating by 113.'),
			green('Equip: Improves haste rating by 108.'),
			green('Equip: Increases spell power by 550.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	132006: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			'Item Level 232',
			'Binds when picked up',
			['Two-Hand', 'Staff'],
			['231 - 427 Damage', 'Speed 2.10'],
			'(156.7 damage per second)',
			'+108 Stamina',
			'+128 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Druid',
			'Requires Level 80',
			green('Equip: Improves critical strike rating by 113.'),
			green('Equip: Improves hit rating by 120.'),
			green('Equip: Increases spell power by 550.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	132007: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			'Item Level 232',
			'Binds when picked up',
			['Two-Hand', 'Staff'],
			['231 - 427 Damage', 'Speed 2.10'],
			'(156.7 damage per second)',
			'+108 Stamina',
			'+128 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Mage',
			'Requires Level 80',
			green('Equip: Improves critical strike rating by 113.'),
			green('Equip: Improves haste rating by 108.'),
			green('Equip: Increases spell power by 550.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	130024: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			'Item Level 232',
			'Binds when picked up',
			['Two-Hand', 'Staff'],
			['231 - 427 Damage', 'Speed 2.10'],
			'(156.7 damage per second)',
			'+108 Stamina',
			'+128 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Warlock',
			'Requires Level 80',
			green('Equip: Improves hit rating by 120.'),
			green('Equip: Improves haste rating by 108.'),
			green('Equip: Increases spell power by 550.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	315003: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 2/2', color: 'yellow' },
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Two-Hand', 'Staff'],
			['281 - 518 Damage', 'Speed 2.10'],
			'(190.2 damage per second)',
			'+116 Stamina',
			'+137 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Mage',
			'Requires Level 80',
			green('Equip: Improves critical strike rating by 135.'),
			green('Equip: Improves haste rating by 113.'),
			green('Equip: Increases spell power by 701.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	315015: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 2/2', color: 'yellow' },
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Two-Hand', 'Staff'],
			['281 - 518 Damage', 'Speed 2.10'],
			'(190.2 damage per second)',
			'+153 Stamina',
			'+153 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Priest',
			'Requires Level 80',
			green('Equip: Improves critical strike rating by 135.'),
			green('Equip: Improves haste rating by 113.'),
			green('Equip: Increases spell power by 701.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	315016: {
		name: 'Atiesh, Greatstaff of the Guardian',
		quality: 'legendary',
		lines: [
			{ text: 'Upgrade Level: 2/2', color: 'yellow' },
			'Item Level 258',
			'Binds when picked up',
			'Unique',
			['Two-Hand', 'Staff'],
			['281 - 518 Damage', 'Speed 2.10'],
			'(190.2 damage per second)',
			'+153 Stamina',
			'+153 Intellect',
			gem('Blue'),
			gem('Red'),
			{ text: 'Socket Bonus: +7 Spell Power', color: 'gray' },
			'Classes: Druid',
			'Requires Level 80',
			green('Equip: Improves hit rating by 135.'),
			green('Equip: Improves critical strike rating by 127.'),
			green('Equip: Increases spell power by 701.'),
			green('Equip: Your offensive spells have a chance on hit to increase your spell power by 285 for 10 sec.'),
		],
	},
	990001: {
		name: 'Glyph of Quick Pain',
		quality: 'common',
		lines: [
			{ text: 'Major Glyph', color: 'blue' },
			{ text: 'Your haste now reduces the time between periodic damage ticks of your Shadow Word: Pain spell.', color: 'yellow' },
		],
	},
};

const LINK_PREFIX = '#wotlksim-item-';

// Lower item level versions of buffed items (e.g. Ulduar): original ID + this offset.
const BASE_VERSION_ID_OFFSET = 10_000_000;

// Special effects of the original (lower item level) versions, from the in-game tooltips.
// Their amounts are also used by the sim (BaseVersionEffectScales).
const BASE_VERSION_EFFECTS: Record<number, Array<string>> = {
	45931: ['Equip: Your melee and ranged attacks have a chance to increase your armor penetration rating by 665 for 10 sec.'],
	46038: ['Equip: Your melee and ranged attacks have a chance to increase your critical strike rating by 612 for 10 sec.'],
	45609: ['Equip: Your melee and ranged attacks have a chance to increase your haste rating by 726 for 10 sec.'],
	45263: ['Use: Increases attack power by 856 for 20 sec. (2 Min Cooldown)'],
	45929: ['Equip: Each time you cast a spell, there is a chance you will gain up to 195 mana per 5 for 15 sec.'],
	45535: ['Equip: Each time you cast a spell, there is a chance you will gain up to 241 mana per 5 for 15 sec.'],
	45518: ['Equip: Your harmful spells have a chance to increase your spell power by 850 for 10 sec.'],
	45490: ['Equip: Your spells have a chance to increase your spell power by 751 for 10 sec.'],
	45466: ['Use: Increases your haste rating by 432 for 20 sec. (2 Min Cooldown)'],
	45148: ['Use: Increases spell power by 505 for 20 sec. (2 Min Cooldown)'],
	45158: ['Use: Increases dodge rating by 432 for 20 sec. (2 Min Cooldown)'],
	45313: ['Use: Increases armor by 5152 for 20 sec. (2 Min Cooldown)'],
	46021: ['Use: Increases parry rating by 380 for 20 sec. (2 Min Cooldown)'],
};

// Original versions with a special effect but no own effect text yet: they use the effect of the
// buffed version (The General's Heart, Blood of the Old God, Meteorite Crystal).
const BASE_VERSIONS_WITH_SHARED_EFFECT = new Set([45507, 45522, 46051]);
const hasSpecialEffect = (originalId: number) => BASE_VERSIONS_WITH_SHARED_EFFECT.has(originalId);

// Minimal shape of a UIItem, so this file doesn't depend on the generated protos.
interface ItemData {
	id: number;
	name: string;
	type: number;
	armorType: number;
	weaponType: number;
	handType: number;
	rangedWeaponType: number;
	stats: Array<number>;
	gemSockets: Array<number>;
	socketBonus: Array<number>;
	weaponDamageMin: number;
	weaponDamageMax: number;
	weaponSpeed: number;
	ilvl: number;
	quality: number;
	unique: boolean;
	heroic: boolean;
	classAllowlist: Array<number>;
}

let itemLookup: ((id: number) => ItemData | undefined) | null = null;
let gemLookup: ((id: number) => { name: string; icon: string; stats: Array<number> } | undefined) | null = null;

// Called by the Database once items are loaded.
export function registerItemLookup(
	lookup: (id: number) => ItemData | undefined,
	gems?: (id: number) => { name: string; icon: string; stats: Array<number> } | undefined,
) {
	itemLookup = lookup;
	if (gems) gemLookup = gems;
}

// Equipped gems and enchant for a custom item link, stored on the link element.
// An enchant with stats is shown as those stats (e.g. "+81 Spell Power"); one without
// (e.g. Berserking) keeps its name.
export function setCustomTooltipGems(
	elem: HTMLElement,
	gemIds: Array<number>,
	enchantName?: string,
	enchantStats?: Array<number>,
	socketBonusActive?: boolean,
) {
	if (gemIds.some(id => id)) {
		elem.dataset.wotlksimGems = gemIds.join(':');
	} else {
		delete elem.dataset.wotlksimGems;
	}
	const enchantText = enchantStats ? statBonusText(enchantStats).join(', ') : '';
	if (enchantText || enchantName) {
		elem.dataset.wotlksimEnchant = enchantText || enchantName;
	} else {
		delete elem.dataset.wotlksimEnchant;
	}
	if (socketBonusActive) {
		elem.dataset.wotlksimSocketBonus = '1';
	} else {
		delete elem.dataset.wotlksimSocketBonus;
	}
}

export function hasCustomTooltip(itemId: number): boolean {
	// Real WotLK item IDs stay below 100000; everything above is a Whitemane item (upgrade
	// levels, epic versions, custom items) that Wowhead doesn't know, so it gets our tooltip.
	return itemId in CUSTOM_TOOLTIPS || itemId > BASE_VERSION_ID_OFFSET || isUpgradeVersion(itemId) || (itemId >= 100_000 && !!itemLookup?.(itemId));
}

const SLOT_NAMES: Record<number, string> = {
	1: 'Head', 2: 'Neck', 3: 'Shoulder', 4: 'Back', 5: 'Chest', 6: 'Wrist', 7: 'Hands', 8: 'Waist',
	9: 'Legs', 10: 'Feet', 11: 'Finger', 12: 'Trinket', 14: 'Ranged',
};
const ARMOR_NAMES: Record<number, string> = { 1: 'Cloth', 2: 'Leather', 3: 'Mail', 4: 'Plate' };
const WEAPON_NAMES: Record<number, string> = {
	1: 'Axe', 2: 'Dagger', 3: 'Fist Weapon', 4: 'Mace', 5: 'Held In Off-hand', 6: 'Polearm', 7: 'Shield', 8: 'Staff', 9: 'Sword',
};
const HAND_NAMES: Record<number, string> = { 1: 'Main Hand', 2: 'One-Hand', 3: 'Off Hand', 4: 'Two-Hand' };
const RANGED_NAMES: Record<number, string> = {
	1: 'Bow', 2: 'Crossbow', 3: 'Gun', 4: 'Idol', 5: 'Libram', 6: 'Thrown', 7: 'Totem', 8: 'Wand', 9: 'Sigil',
};
const CLASS_NAMES: Record<number, string> = {
	1: 'Druid', 2: 'Hunter', 3: 'Mage', 4: 'Paladin', 5: 'Priest', 6: 'Rogue', 7: 'Shaman', 8: 'Warlock', 9: 'Warrior', 10: 'Death Knight',
};
const SOCKET_NAMES: Record<number, string> = { 1: 'Meta', 2: 'Red', 3: 'Blue', 4: 'Yellow', 8: 'Prismatic' };
const QUALITY_NAMES: Record<number, CustomTooltip['quality']> = { 4: 'epic', 5: 'legendary' };

// Stat indices (proto Stat enum order).
const S = {
	str: 0, agi: 1, sta: 2, int: 3, spi: 4, sp: 5, mp5: 6, spellHit: 7, spellCrit: 8, spellHaste: 9, spellPen: 10,
	ap: 11, hit: 12, crit: 13, haste: 14, arp: 15, exp: 16, mana: 17, armor: 20, rangedAp: 21, def: 22,
	block: 23, blockValue: 24, dodge: 25, parry: 26, resil: 27, health: 28, arcaneResist: 29, fireResist: 30,
	frostResist: 31, natureResist: 32, shadowResist: 33, bonusArmor: 34,
};

function statBonusText(stats: Array<number>): Array<string> {
	const v = (i: number) => Math.round(stats[i] || 0);
	const parts: Array<string> = [];
	const add = (amount: number, name: string) => amount && parts.push(`+${amount} ${name}`);
	const primary = [v(S.str), v(S.agi), v(S.sta), v(S.int), v(S.spi)];
	if (primary[0] > 0 && primary.every(amount => amount == primary[0])) {
		// e.g. Nightmare Tear, chest enchants: "+6 to All Stats" as in game
		parts.push(`+${primary[0]} to All Stats`);
	} else {
		add(v(S.str), 'Strength');
		add(v(S.agi), 'Agility');
		add(v(S.sta), 'Stamina');
		add(v(S.int), 'Intellect');
		add(v(S.spi), 'Spirit');
	}
	add(v(S.sp), 'Spell Power');
	add(v(S.mp5), 'Mana per 5 sec.');
	add(v(S.mana), 'Mana');
	add(v(S.ap), 'Attack Power');
	if (v(S.rangedAp) != v(S.ap)) add(v(S.rangedAp), 'Ranged Attack Power');
	add(Math.max(v(S.crit), v(S.spellCrit)), 'Critical Strike Rating');
	add(Math.max(v(S.hit), v(S.spellHit)), 'Hit Rating');
	add(Math.max(v(S.haste), v(S.spellHaste)), 'Haste Rating');
	add(v(S.spellPen), 'Spell Penetration');
	add(v(S.arp), 'Armor Penetration Rating');
	add(v(S.exp), 'Expertise Rating');
	add(v(S.armor), 'Armor');
	add(v(S.def), 'Defense Rating');
	add(v(S.block), 'Block Rating');
	add(v(S.blockValue), 'Block Value');
	add(v(S.dodge), 'Dodge Rating');
	add(v(S.parry), 'Parry Rating');
	add(v(S.resil), 'Resilience Rating');
	add(v(S.bonusArmor), 'Bonus Armor');
	add(v(S.health), 'Health');
	add(v(S.arcaneResist), 'Arcane Resistance');
	add(v(S.fireResist), 'Fire Resistance');
	add(v(S.frostResist), 'Frost Resistance');
	add(v(S.natureResist), 'Nature Resistance');
	add(v(S.shadowResist), 'Shadow Resistance');
	return parts;
}

function buildGenericTooltip(itemId: number): CustomTooltip | null {
	const item = itemLookup?.(itemId);
	if (!item) {
		return null;
	}
	const stat = (i: number) => Math.round(item.stats[i] || 0);
	const lines: CustomTooltip['lines'] = [];

	if (item.heroic) lines.push({ text: 'Heroic', color: 'green' });
	lines.push(`Item Level ${item.ilvl}`);
	lines.push('Binds when picked up');
	if (item.unique) lines.push('Unique');

	if (item.type == 13) {
		if (item.weaponType == 5) {
			lines.push('Held In Off-hand');
		} else {
			lines.push([HAND_NAMES[item.handType] || '', WEAPON_NAMES[item.weaponType] || '']);
		}
	} else if (item.type == 14) {
		lines.push(['Ranged', RANGED_NAMES[item.rangedWeaponType] || '']);
	} else {
		lines.push([SLOT_NAMES[item.type] || '', ARMOR_NAMES[item.armorType] || '']);
	}
	if (item.weaponSpeed > 0 && item.weaponDamageMax > 0) {
		lines.push([`${Math.round(item.weaponDamageMin)} - ${Math.round(item.weaponDamageMax)} Damage`, `Speed ${item.weaponSpeed.toFixed(2)}`]);
		lines.push(`(${((item.weaponDamageMin + item.weaponDamageMax) / 2 / item.weaponSpeed).toFixed(1)} damage per second)`);
	}
	if (stat(S.armor) + stat(S.bonusArmor)) lines.push(`${stat(S.armor) + stat(S.bonusArmor)} Armor`);

	for (const [i, name] of [[S.str, 'Strength'], [S.agi, 'Agility'], [S.sta, 'Stamina'], [S.int, 'Intellect'], [S.spi, 'Spirit']] as Array<[number, string]>) {
		if (stat(i)) lines.push(`+${stat(i)} ${name}`);
	}
	for (const socket of item.gemSockets) {
		lines.push(gem(SOCKET_NAMES[socket] || 'Prismatic'));
	}
	const bonus = statBonusText(item.socketBonus || []);
	if (bonus.length) lines.push({ text: `Socket Bonus: ${bonus.join(', ')}`, color: 'gray' });
	if (item.classAllowlist?.length) lines.push('Classes: ' + item.classAllowlist.map(c => CLASS_NAMES[c] || '').join(', '));
	lines.push('Requires Level 80');

	const equip = (amount: number, text: string) => amount && lines.push(green(`Equip: ${text.replace('#', String(amount))}`));
	equip(stat(S.def), 'Increases defense rating by #.');
	equip(stat(S.dodge), 'Increases your dodge rating by #.');
	equip(stat(S.parry), 'Increases your parry rating by #.');
	equip(stat(S.block), 'Increases your shield block rating by #.');
	equip(stat(S.blockValue), 'Increases the block value of your shield by #.');
	equip(Math.max(stat(S.hit), stat(S.spellHit)), 'Improves hit rating by #.');
	equip(Math.max(stat(S.crit), stat(S.spellCrit)), 'Improves critical strike rating by #.');
	equip(Math.max(stat(S.haste), stat(S.spellHaste)), 'Improves haste rating by #.');
	equip(stat(S.exp), 'Increases your expertise rating by #.');
	equip(stat(S.arp), 'Increases your armor penetration rating by #.');
	equip(stat(S.ap), 'Increases attack power by #.');
	equip(stat(S.sp), 'Increases spell power by #.');
	equip(stat(S.mp5), 'Restores # mana per 5 sec.');
	equip(stat(S.spellPen), 'Increases your spell penetration by #.');

	const baseEffects = itemId > BASE_VERSION_ID_OFFSET ? BASE_VERSION_EFFECTS[itemId - BASE_VERSION_ID_OFFSET] : undefined;
	const effectLines = VARIANT_EFFECTS[String(itemId)] || baseEffects || [];
	for (const text of effectLines) {
		lines.push(green(text));
	}

	const upgradeLevel = getUpgradeLevel(itemId);
	const chainBase = upgradeLevel > 0 ? itemLookup?.(getUpgradeChainBase(itemId)) : undefined;
	if (chainBase) {
		lines.push({ text: `Upgrade +${upgradeLevel} of the item level ${chainBase.ilvl} version.`, color: 'gray' });
	}
	const original = itemLookup?.(itemId - BASE_VERSION_ID_OFFSET);
	if (original && !baseEffects && hasSpecialEffect(itemId - BASE_VERSION_ID_OFFSET)) {
		lines.push({ text: `Original item level version. Special effects as on the item level ${original.ilvl} version.`, color: 'gray' });
	}

	return { name: item.name, quality: QUALITY_NAMES[item.quality] || 'epic', lines };
}

export function customItemUrl(itemId: number): string {
	return LINK_PREFIX + itemId;
}

const QUALITY_COLORS = { legendary: '#ff8000', epic: '#a335ee', common: '#ffffff' };
const LINE_COLORS = { green: '#1eff00', gray: '#9d9d9d', yellow: '#ffd100', blue: '#71d5ff' };

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const isSocketLine = (line: CustomTooltip['lines'][number]) => typeof line === 'object' && !Array.isArray(line) && 'socket' in line;
const isSocketBonusLine = (line: CustomTooltip['lines'][number]) =>
	typeof line === 'object' && !Array.isArray(line) && 'text' in line && line.text.startsWith('Socket Bonus:');

function renderTooltip(tooltip: CustomTooltip, gemIds: Array<number>, enchantText?: string, socketBonusActive?: boolean): string {
	let html = `<div style="color:${QUALITY_COLORS[tooltip.quality]};font-size:1.05em;font-weight:600">${escapeHtml(tooltip.name)}</div>`;

	// The enchant goes below the item's stats and above its sockets (as in game): before the
	// first socket line, or, without sockets, before the first line after the white stats.
	let enchantIdx = -1;
	if (enchantText) {
		enchantIdx = tooltip.lines.findIndex(line => isSocketLine(line) || isSocketBonusLine(line));
		if (enchantIdx < 0) {
			const lastStatIdx = tooltip.lines.reduce((last, line, i) => (typeof line === 'string' && /^\+\d/.test(line) ? i : last), -1);
			enchantIdx = lastStatIdx >= 0 ? lastStatIdx + 1 : tooltip.lines.length;
		}
	}

	// Gems beyond the item's own sockets (the extra socket from an Eternal Belt Buckle) are shown
	// as an extra prismatic socket after the last socket, or where the sockets would be.
	const socketCount = tooltip.lines.filter(isSocketLine).length;
	const extraGemIds = gemIds.slice(socketCount).filter(id => id);
	let extraGemsIdx = -1;
	if (extraGemIds.length) {
		const lastSocketIdx = tooltip.lines.reduce((last, line, i) => (isSocketLine(line) ? i : last), -1);
		if (lastSocketIdx >= 0) {
			extraGemsIdx = lastSocketIdx + 1;
		} else {
			extraGemsIdx = tooltip.lines.findIndex(isSocketBonusLine);
			if (extraGemsIdx < 0) {
				const lastStatIdx = tooltip.lines.reduce((last, line, i) => (typeof line === 'string' && /^\+\d/.test(line) ? i : last), -1);
				extraGemsIdx = lastStatIdx >= 0 ? lastStatIdx + 1 : tooltip.lines.length;
			}
		}
	}
	const iconStyle = 'width:14px;height:14px;vertical-align:-2px;margin-right:6px';
	const gemHtml = (gemId: number, socketColor: string) => {
		const gemData = gemId ? gemLookup?.(gemId) : undefined;
		if (gemData) {
			const gemStats = statBonusText(gemData.stats);
			const gemDescription = gemStats.length > 0 ? gemStats.join(', ') : gemData.name;
			return `<div><img src="https://wow.zamimg.com/images/wow/icons/small/${gemData.icon}.jpg" style="${iconStyle}">${escapeHtml(gemDescription)}</div>`;
		}
		return `<div style="color:${LINE_COLORS.gray}"><img src="https://wow.zamimg.com/images/icons/socket-${socketColor.toLowerCase()}.gif" style="${iconStyle}">${escapeHtml(socketColor)} Socket</div>`;
	};
	const extraGemsHtml = () => extraGemIds.map(id => gemHtml(id, 'Prismatic')).join('');

	let socketIdx = 0;
	for (const [lineIdx, line] of tooltip.lines.entries()) {
		if (lineIdx == enchantIdx) {
			html += `<div style="color:${LINE_COLORS.green}">${escapeHtml(enchantText!)}</div>`;
		}
		if (lineIdx == extraGemsIdx) {
			html += extraGemsHtml();
		}
		if (isSocketBonusLine(line) && socketBonusActive && typeof line === 'object' && 'text' in line) {
			html += `<div style="color:${LINE_COLORS.green}">${escapeHtml(line.text)}</div>`;
		} else if (typeof line === 'object' && !Array.isArray(line) && 'socket' in line) {
			html += gemHtml(gemIds[socketIdx], line.socket);
			socketIdx++;
		} else if (typeof line === 'string') {
			html += `<div>${escapeHtml(line)}</div>`;
		} else if (Array.isArray(line)) {
			html += `<div style="display:flex;justify-content:space-between;gap:2em"><span>${escapeHtml(line[0])}</span><span>${escapeHtml(line[1])}</span></div>`;
		} else if ('text' in line) {
			html += `<div style="color:${LINE_COLORS[line.color]}">${escapeHtml(line.text)}</div>`;
		}
	}
	if (enchantIdx == tooltip.lines.length) {
		html += `<div style="color:${LINE_COLORS.green}">${escapeHtml(enchantText!)}</div>`;
	}
	if (extraGemsIdx == tooltip.lines.length) {
		html += extraGemsHtml();
	}
	return html;
}

let tooltipElem: HTMLDivElement | null = null;

function getTooltipElem(): HTMLDivElement {
	if (!tooltipElem) {
		tooltipElem = document.createElement('div');
		tooltipElem.className = 'wotlksim-custom-tooltip';
		Object.assign(tooltipElem.style, {
			position: 'fixed',
			zIndex: '100000',
			maxWidth: '340px',
			padding: '8px 10px',
			background: 'rgba(5, 10, 30, 0.95)',
			border: '1px solid #9a9a9a',
			borderRadius: '4px',
			color: '#ffffff',
			fontSize: '13px',
			lineHeight: '1.35',
			pointerEvents: 'none',
			display: 'none',
		});
		document.body.appendChild(tooltipElem);
	}
	return tooltipElem;
}

function positionTooltip(elem: HTMLDivElement, event: MouseEvent) {
	const margin = 16;
	const rect = elem.getBoundingClientRect();
	let left = event.clientX + margin;
	let top = event.clientY + margin;
	if (left + rect.width > window.innerWidth) left = event.clientX - rect.width - margin;
	if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 4;
	elem.style.left = `${Math.max(4, left)}px`;
	elem.style.top = `${Math.max(4, top)}px`;
}

function findCustomLink(target: EventTarget | null): HTMLAnchorElement | null {
	if (!(target instanceof Element)) return null;
	const anchor = target.closest('a');
	if (!anchor) return null;
	const href = anchor.getAttribute('href') || '';
	return href.includes(LINK_PREFIX) ? anchor : null;
}

function install() {
	if (typeof document === 'undefined') return;

	document.addEventListener('mouseover', event => {
		const anchor = findCustomLink(event.target);
		if (!anchor) return;
		const id = Number((anchor.getAttribute('href') || '').split(LINK_PREFIX)[1]);
		const tooltip = CUSTOM_TOOLTIPS[id] ?? buildGenericTooltip(id);
		if (!tooltip) return;
		const elem = getTooltipElem();
		const gemIds = (anchor.dataset.wotlksimGems || '').split(':').map(Number);
		elem.innerHTML = renderTooltip(tooltip, gemIds, anchor.dataset.wotlksimEnchant, anchor.dataset.wotlksimSocketBonus == '1');
		elem.style.display = 'block';
		positionTooltip(elem, event);
	});
	document.addEventListener('mousemove', event => {
		if (tooltipElem && tooltipElem.style.display === 'block') {
			if (findCustomLink(event.target)) {
				positionTooltip(tooltipElem, event);
			} else {
				tooltipElem.style.display = 'none';
			}
		}
	});
	document.addEventListener('mouseout', event => {
		if (tooltipElem && findCustomLink(event.target) && !findCustomLink(event.relatedTarget)) {
			tooltipElem.style.display = 'none';
		}
	});
	// Custom links point at "#...", which would otherwise scroll/jump the page.
	document.addEventListener(
		'click',
		event => {
			const anchor = findCustomLink(event.target);
			if (anchor) event.preventDefault();
		},
		true,
	);
}

install();
