import upgradeChainData from '../../assets/db_inputs/wotlk_upgrade_chains.json';
import { UIItem as Item } from './proto/ui.js';

// wotlksim: upgrade chains for items that exist in several item levels.
// The item picker's Upgrade tab lists every version of the equipped item,
// lowest item level first. Items without other versions just show themselves.

// Lower item level versions of buffed items (e.g. Ulduar) use the original item ID
// plus this offset. Keep in sync with BaseVersionIDOffset in the Go code.
export const BASE_VERSION_ID_OFFSET = 10_000_000;

// Upgrade levels: base item first, then +1, +2, ...
const LEVEL_CHAINS: Array<Array<number>> = [
	[150005, 150090, 315005], // Stormcoil 1/3, 2/3, 3/3
	[131004, 315008], // Doomhammer
	[128858, 315010], // Embersoul, Scythe of the Cat God 1/2, 2/2
	[130031, 315004], // Armata Strigoi 1/2, 2/2
	[132005, 315015], // Atiesh (Priest) 1/2, 2/2
	[132006, 315016], // Atiesh (Druid) 1/2, 2/2
	[132007, 315003], // Atiesh (Mage) 1/2, 2/2
	...upgradeChainData.chains, // dungeon/raid item upgrades +1 ... +5
];

// Every version of an item for the Upgrade tab: upgrade levels and epic versions
// ([base item, epic version]) of quest/dungeon items.
const UPGRADE_CHAINS: Array<Array<number>> = [...LEVEL_CHAINS, ...upgradeChainData.epicVariants];

// Upgrade levels (every level chain entry after the first, and the lower item level versions
// with offset IDs) are only listed in the Upgrade tab, not in the normal item list.
// Epic versions stay in the normal list.
const UPGRADE_VERSION_IDS = new Set<number>(LEVEL_CHAINS.flatMap(chain => chain.slice(1)));

export function isUpgradeVersion(itemId: number): boolean {
	return itemId > BASE_VERSION_ID_OFFSET || UPGRADE_VERSION_IDS.has(itemId);
}

// Position of an item in its upgrade chain: 0 for the base version, 1 for +1 and so on.
// Returns 0 for items without upgrades.
const UPGRADE_LEVELS = new Map<number, number>(LEVEL_CHAINS.flatMap(chain => chain.map((id, level): [number, number] => [id, level])));

export function getUpgradeLevel(itemId: number): number {
	return UPGRADE_LEVELS.get(itemId) ?? 0;
}

// First (base) item of the item's upgrade chain, or the item itself.
export function getUpgradeChainBase(itemId: number): number {
	const chain = LEVEL_CHAINS.find(c => c.includes(itemId));
	return chain ? chain[0] : itemId;
}

export function getUpgradeChain(
	itemId: number,
	hasItem: (id: number) => boolean,
	getItem?: (id: number) => Item | undefined,
	getAllItems?: () => Array<Item>,
): Array<number> {
	const chain = UPGRADE_CHAINS.find(c => c.includes(itemId));
	if (chain) {
		// An epic version can have upgrade levels of its own (dungeon items: blue -> epic 200 ->
		// +1 213 -> +2 232): join the [blue, epic] pair and the epic's level chain into one list.
		const full = [...chain];
		for (let changed = true; changed; ) {
			changed = false;
			for (const other of UPGRADE_CHAINS) {
				if (other !== chain && other.some(id => full.includes(id)) && other.some(id => !full.includes(id))) {
					const joinAt = other.findIndex(id => full.includes(id));
					const anchor = full.indexOf(other[joinAt]);
					const before = other.slice(0, joinAt).filter(id => !full.includes(id));
					const after = other.slice(joinAt + 1).filter(id => !full.includes(id));
					full.splice(anchor + 1, 0, ...after);
					full.splice(anchor, 0, ...before);
					changed = true;
				}
			}
		}
		return full;
	}

	const item = getItem?.(itemId);
	if (item && getAllItems && (item.name.startsWith("Heroes' ") || item.name.startsWith('Valorous '))) {
		const prefixLength = item.name.startsWith("Heroes' ") ? 8 : 9;
		const matchingPrefix = item.name.startsWith("Heroes' ") ? 'Valorous ' : "Heroes' ";
		const upgradedName = matchingPrefix + item.name.slice(prefixLength);
		const matchingItem = getAllItems().find(candidate =>
			candidate.name == upgradedName &&
			candidate.type == item.type &&
			candidate.setName == item.setName &&
			candidate.classAllowlist.join(',') == item.classAllowlist.join(','),
		);
		if (matchingItem) {
			return [item.id, matchingItem.id];
		}
	}

	const originalId = itemId > BASE_VERSION_ID_OFFSET ? itemId - BASE_VERSION_ID_OFFSET : itemId;
	const baseId = originalId + BASE_VERSION_ID_OFFSET;
	if (hasItem(baseId)) {
		return [baseId, originalId];
	}
	return [itemId];
}
