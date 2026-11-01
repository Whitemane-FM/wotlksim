package core

// wotlksim: effect amounts of the original (lower item level) versions of buffed items
// (IDs offset by BaseVersionIDOffset), as a factor of the effect the sim uses for the
// buffed item. Values from the in-game tooltips on Whitemane Frostmourne Rebuffed.
var BaseVersionEffectScales = map[int32]float64{
	BaseVersionIDOffset + 45931: 665.0 / 751.0,   // Mjolnir Runestone 226: 665 armor penetration
	BaseVersionIDOffset + 46038: 612.0 / 692.0,   // Dark Matter 226: 612 critical strike
	BaseVersionIDOffset + 45609: 726.0 / 819.0,   // Comet's Trail 239: 726 haste
	BaseVersionIDOffset + 45263: 856.0 / 905.0,   // Wrathstone 226: 856 attack power
	BaseVersionIDOffset + 45929: 195.0 / 220.0,   // Sif's Remembrance 226: 195 mp5
	BaseVersionIDOffset + 45535: 241.0 / 272.0,   // Show of Faith 239: 241 mp5
	BaseVersionIDOffset + 45518: 850.0 / 959.0,   // Flare of the Heavens 239: 850 spell power
	BaseVersionIDOffset + 45490: 751.0 / 794.0,   // Pandora's Plea 226: 751 spell power
	BaseVersionIDOffset + 45466: 432.0 / 457.0,   // Scale of Fates 226: 432 haste
	BaseVersionIDOffset + 45148: 505.0 / 534.0,   // Living Flame 226: 505 spell power
	BaseVersionIDOffset + 45158: 432.0 / 457.0,   // Heart of Iron 226: 432 dodge
	BaseVersionIDOffset + 45313: 5152.0 / 5448.0, // Furnace Stone 219: 5152 armor
	BaseVersionIDOffset + 45522: 1284.0 / 1358.0, // Blood of the Old God 226: 1284 attack power
	BaseVersionIDOffset + 46051: 60.0 / 85.0,     // Meteorite Crystal 226: 60 mp5 per stack
	// The General's Heart 226: 205 damage reduction, same as the sim's effect, no scaling.
	BaseVersionIDOffset + 46021: 380.0 / 402.0, // Royal Seal of King Llane 219: 380 parry
}
