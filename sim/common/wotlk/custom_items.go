package wotlk

// wotlksim custom item effects. Item data lives in tools/database/custom_items.go.
// Class-specific custom effects:
//   - Embersoul (finisher discount): sim/druid/items_custom.go
//   - Doomhammer (Lava Burst reset): sim/shaman/shocks.go
// The base Stormcoil has no special effect; its upgraded versions have a lightning proc.

import (
	"time"

	"github.com/wowsims/wotlk/sim/core"
	"github.com/wowsims/wotlk/sim/core/stats"
)

const (
	armataStrigoiID    = 130031
	armataStrigoi2ID   = 315004 // upgraded version, same effect
	stormcoil2ID       = 150090
	stormcoil3ID       = 315005
	nargarothID        = 315007
	furyOfTheSunwellID = 217741
	nightwingID        = 315006
)

func init() {
	// Custom items are not part of the upstream item-effect regression tests.
	core.AddEffectsToTest = false
	defer func() { core.AddEffectsToTest = true }()

	// Armata Strigoi: 1.5 PPM (9% per roll at 3.60 speed), no internal cooldown, on every
	// landed melee attack: auto attacks and specials (e.g. Crusader Strike, Divine Storm
	// per target hit, Judgement, Hammer of Wrath). Each roll binds a Forgotten Soul.
	// At 4 souls they are released and trigger an instant weapon attack. That attack
	// is an extra auto attack (white hit), so it triggers everything an auto attack
	// does (e.g. Seal of Vengeance stacks and seal damage), except Armata itself.
	armataEffect := func(agent core.Agent) {
		character := agent.GetCharacter()

		soulAttack := character.RegisterSpell(core.SpellConfig{
			ActionID:    core.ActionID{ItemID: armataStrigoiID},
			SpellSchool: core.SpellSchoolPhysical,
			ProcMask:    core.ProcMaskMeleeMHAuto,
			Flags:       core.SpellFlagMeleeMetrics | core.SpellFlagIncludeTargetBonusDamage,

			DamageMultiplier: 1,
			CritMultiplier:   character.DefaultMeleeCritMultiplier(),
			ThreatMultiplier: 1,

			ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
				baseDamage := spell.Unit.MHWeaponDamage(sim, spell.MeleeAttackPower()) + spell.BonusWeaponDamage()
				spell.CalcAndDealDamage(sim, target, baseDamage, spell.OutcomeMeleeWhite)
			},
		})

		souls := character.RegisterAura(core.Aura{
			Label:     "Forgotten Souls",
			ActionID:  core.ActionID{ItemID: armataStrigoiID, Tag: 1},
			Duration:  core.NeverExpires,
			MaxStacks: 4,
		})

		core.MakeProcTriggerAura(&character.Unit, core.ProcTrigger{
			Name:     "Armata Strigoi",
			Callback: core.CallbackOnSpellHitDealt,
			ProcMask: core.ProcMaskMelee,
			Outcome:  core.OutcomeLanded,
			PPM:      1.5,
			Handler: func(sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
				if spell == soulAttack {
					return // the released souls don't bind new ones
				}
				souls.Activate(sim)
				souls.AddStack(sim)
				if souls.GetStacks() >= souls.MaxStacks {
					souls.SetStacks(sim, 0)
					souls.Deactivate(sim)
					soulAttack.Cast(sim, result.Target)
				}
			},
		})
	}
	core.NewItemEffect(armataStrigoiID, armataEffect)
	core.NewItemEffect(armataStrigoi2ID, armataEffect)

	// Stormcoil (upgrade levels 2/3 and 3/3): chance on hit to hurl a lightning
	// bolt for 734-838 Nature damage that jumps to additional nearby enemies,
	// each jump dealing 30% less, 3 targets total. 15 sec cooldown.
	// The proc chance isn't on the tooltip; 15% per ranged hit is assumed.
	stormcoilEffect := func(itemID int32) core.ApplyEffect {
		return func(agent core.Agent) {
			character := agent.GetCharacter()

			lightning := character.RegisterSpell(core.SpellConfig{
				ActionID:    core.ActionID{ItemID: itemID},
				SpellSchool: core.SpellSchoolNature,
				ProcMask:    core.ProcMaskEmpty,

				DamageMultiplier: 1,
				CritMultiplier:   character.DefaultSpellCritMultiplier(),
				ThreatMultiplier: 1,

				ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
					damageMult := 1.0
					curTarget := target
					numHits := min(3, int(sim.GetNumTargets()))
					for hit := 0; hit < numHits; hit++ {
						spell.CalcAndDealDamage(sim, curTarget, sim.Roll(734, 838)*damageMult, spell.OutcomeMagicHitAndCrit)
						damageMult *= 0.7
						curTarget = sim.Environment.NextTargetUnit(curTarget)
					}
				},
			})

			core.MakeProcTriggerAura(&character.Unit, core.ProcTrigger{
				Name:       "Stormcoil",
				ActionID:   core.ActionID{ItemID: itemID},
				Callback:   core.CallbackOnSpellHitDealt,
				ProcMask:   core.ProcMaskRanged,
				Outcome:    core.OutcomeLanded,
				ProcChance: 0.15,
				ICD:        time.Second * 15,
				Handler: func(sim *core.Simulation, _ *core.Spell, result *core.SpellResult) {
					lightning.Cast(sim, result.Target)
				},
			})
		}
	}
	core.NewItemEffect(stormcoil2ID, stormcoilEffect(stormcoil2ID))
	core.NewItemEffect(stormcoil3ID, stormcoilEffect(stormcoil3ID))

	// Atiesh, Greatstaff of the Guardian (Whitemane, all class versions and upgrades):
	// offensive spells have a chance on hit to increase spell power by 285 for 10 sec.
	// The tooltip gives no chance or cooldown; 10% with a 45 sec cooldown is assumed.
	for _, atieshID := range []int32{132005, 132006, 132007, 130024, 315015, 315016, 315003} {
		itemID := atieshID
		core.NewItemEffect(itemID, func(agent core.Agent) {
			character := agent.GetCharacter()
			buff := character.NewTemporaryStatsAura("Atiesh", core.ActionID{ItemID: itemID}, stats.Stats{stats.SpellPower: 285}, time.Second*10)
			core.MakeProcTriggerAura(&character.Unit, core.ProcTrigger{
				Name:       "Atiesh Trigger",
				Callback:   core.CallbackOnSpellHitDealt,
				ProcMask:   core.ProcMaskSpellDamage,
				Outcome:    core.OutcomeLanded,
				ProcChance: 0.10,
				ICD:        time.Second * 45,
				Handler: func(sim *core.Simulation, _ *core.Spell, _ *core.SpellResult) {
					buff.Activate(sim)
				},
			})
		})
	}

	// Nargaroth, Warden of the Dark Tower: 10% chance on hit (1 min ICD).
	// For 8 sec: 10% less damage taken and 1200 Fire damage to nearby enemies
	// every second. Each damaging tick grants 2 Runic Power or 2 Rage.
	core.NewItemEffect(nargarothID, func(agent core.Agent) {
		character := agent.GetCharacter()
		actionID := core.ActionID{ItemID: nargarothID}

		var rageMetrics, rpMetrics *core.ResourceMetrics
		if character.HasRageBar() {
			rageMetrics = character.NewRageMetrics(actionID)
		}
		if character.HasRunicPowerBar() {
			rpMetrics = character.NewRunicPowerMetrics(actionID)
		}

		scorch := character.RegisterSpell(core.SpellConfig{
			ActionID:    actionID.WithTag(1),
			SpellSchool: core.SpellSchoolFire,
			ProcMask:    core.ProcMaskEmpty,

			DamageMultiplier: 1,
			CritMultiplier:   character.DefaultSpellCritMultiplier(),
			ThreatMultiplier: 1,

			ApplyEffects: func(sim *core.Simulation, _ *core.Unit, spell *core.Spell) {
				dealt := false
				for _, target := range sim.Encounter.TargetUnits {
					result := spell.CalcAndDealDamage(sim, target, 1200, spell.OutcomeMagicHit)
					dealt = dealt || result.Landed()
				}
				if !dealt {
					return
				}
				if rpMetrics != nil {
					character.AddRunicPower(sim, 2, rpMetrics)
				} else if rageMetrics != nil {
					character.AddRage(sim, 2, rageMetrics)
				}
			},
		})

		var ticker *core.PendingAction
		darkFire := character.RegisterAura(core.Aura{
			Label:    "Nargaroth Dark Fire",
			ActionID: actionID,
			Duration: time.Second * 8,
			OnGain: func(aura *core.Aura, sim *core.Simulation) {
				character.PseudoStats.DamageTakenMultiplier *= 0.9
				ticker = core.StartPeriodicAction(sim, core.PeriodicActionOptions{
					Period:   time.Second,
					NumTicks: 8,
					OnAction: func(sim *core.Simulation) {
						scorch.Cast(sim, character.CurrentTarget)
					},
				})
			},
			OnExpire: func(aura *core.Aura, sim *core.Simulation) {
				character.PseudoStats.DamageTakenMultiplier /= 0.9
				if ticker != nil {
					ticker.Cancel(sim)
					ticker = nil
				}
			},
		})

		core.MakeProcTriggerAura(&character.Unit, core.ProcTrigger{
			Name:       "Nargaroth",
			Callback:   core.CallbackOnSpellHitDealt,
			ProcMask:   core.ProcMaskMelee,
			Outcome:    core.OutcomeLanded,
			ProcChance: 0.10,
			ICD:        time.Minute,
			Handler: func(sim *core.Simulation, _ *core.Spell, _ *core.SpellResult) {
				darkFire.Activate(sim)
			},
		})
	})

	// Fury of the Sunwell: when attacked (40 sec cooldown), gain a 2750 absorb
	// shield for 6 sec. When the shield ends it always erupts for 3950 Holy
	// damage to nearby enemies.
	core.NewItemEffect(furyOfTheSunwellID, func(agent core.Agent) {
		character := agent.GetCharacter()
		actionID := core.ActionID{ItemID: furyOfTheSunwellID}
		const absorbAmount = 2750.0

		eruption := character.RegisterSpell(core.SpellConfig{
			ActionID:    actionID.WithTag(1),
			SpellSchool: core.SpellSchoolHoly,
			ProcMask:    core.ProcMaskEmpty,

			DamageMultiplier: 1,
			CritMultiplier:   character.DefaultSpellCritMultiplier(),
			ThreatMultiplier: 1,

			ApplyEffects: func(sim *core.Simulation, _ *core.Unit, spell *core.Spell) {
				for _, target := range sim.Encounter.TargetUnits {
					spell.CalcAndDealDamage(sim, target, 3950, spell.OutcomeMagicHit)
				}
			},
		})

		remaining := 0.0
		shield := character.RegisterAura(core.Aura{
			Label:    "Sunwell's Protection",
			ActionID: actionID,
			Duration: time.Second * 6,
			OnGain: func(aura *core.Aura, sim *core.Simulation) {
				remaining = absorbAmount
			},
			OnExpire: func(aura *core.Aura, sim *core.Simulation) {
				remaining = 0
				eruption.Cast(sim, character.CurrentTarget)
			},
		})

		character.AddDynamicDamageTakenModifier(func(sim *core.Simulation, _ *core.Spell, result *core.SpellResult) {
			if !shield.IsActive() || result.Damage <= 0 {
				return
			}
			absorbed := min(remaining, result.Damage)
			result.Damage -= absorbed
			remaining -= absorbed
			if remaining <= 0 {
				shield.Deactivate(sim)
			}
		})

		core.MakeProcTriggerAura(&character.Unit, core.ProcTrigger{
			Name:       "Fury of the Sunwell",
			Callback:   core.CallbackOnSpellHitTaken,
			ProcMask:   core.ProcMaskMelee,
			ProcChance: 1,
			ICD:        time.Second * 40,
			Handler: func(sim *core.Simulation, _ *core.Spell, _ *core.SpellResult) {
				shield.Activate(sim)
			},
		})
	})

	// Nightwing: offensive spells have a 10% chance (45 sec cooldown) to summon a
	// raven for 10 sec. It stores 21% of your spell damage dealt and unleashes it
	// when it expires.
	core.NewItemEffect(nightwingID, func(agent core.Agent) {
		character := agent.GetCharacter()
		actionID := core.ActionID{ItemID: nightwingID}
		const storedFraction = 0.21

		stored := 0.0
		unleash := character.RegisterSpell(core.SpellConfig{
			ActionID:    actionID.WithTag(1),
			SpellSchool: core.SpellSchoolShadow,
			ProcMask:    core.ProcMaskEmpty,
			Flags:       core.SpellFlagIgnoreModifiers | core.SpellFlagNoOnCastComplete,

			DamageMultiplier: 1,
			ThreatMultiplier: 1,

			ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
				spell.CalcAndDealDamage(sim, target, stored, spell.OutcomeAlwaysHit)
			},
		})

		store := func(spell *core.Spell, result *core.SpellResult) {
			if spell == unleash || result.Damage <= 0 {
				return
			}
			stored += result.Damage * storedFraction
		}

		raven := character.RegisterAura(core.Aura{
			Label:    "Nightwing Raven",
			ActionID: actionID,
			Duration: time.Second * 10,
			OnGain: func(aura *core.Aura, sim *core.Simulation) {
				stored = 0
			},
			OnSpellHitDealt: func(aura *core.Aura, sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
				if spell.ProcMask.Matches(core.ProcMaskSpellDamage) {
					store(spell, result)
				}
			},
			OnPeriodicDamageDealt: func(aura *core.Aura, sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
				store(spell, result)
			},
			OnExpire: func(aura *core.Aura, sim *core.Simulation) {
				if stored > 0 && character.CurrentTarget != nil {
					unleash.Cast(sim, character.CurrentTarget)
				}
				stored = 0
			},
		})

		// "Offensive spell casts": any spell the player casts that isn't a heal.
		// (Most shadow/affliction casts are DoTs or channels whose direct hit
		// deals no damage, so a damage-on-hit trigger would almost never fire.)
		core.MakeProcTriggerAura(&character.Unit, core.ProcTrigger{
			Name:            "Nightwing",
			Callback:        core.CallbackOnCastComplete,
			SpellFlags:      core.SpellFlagAPL,
			ProcMaskExclude: core.ProcMaskSpellHealing,
			ProcChance:      0.10,
			ICD:             time.Second * 45,
			Handler: func(sim *core.Simulation, _ *core.Spell, _ *core.SpellResult) {
				raven.Activate(sim)
			},
		})
	})
}
