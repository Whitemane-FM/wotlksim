package retribution

import (
	"github.com/wowsims/wotlk/sim/core"
	"github.com/wowsims/wotlk/sim/core/proto"
	"github.com/wowsims/wotlk/sim/core/stats"
	"github.com/wowsims/wotlk/sim/paladin"
)

func RegisterRetributionPaladin() {
	core.RegisterAgentFactory(
		proto.Player_RetributionPaladin{},
		proto.Spec_SpecRetributionPaladin,
		func(character *core.Character, options *proto.Player) core.Agent {
			return NewRetributionPaladin(character, options)
		},
		func(player *proto.Player, spec interface{}) {
			playerSpec, ok := spec.(*proto.Player_RetributionPaladin) // I don't really understand this line
			if !ok {
				panic("Invalid spec value for Retribution Paladin!")
			}
			player.Spec = playerSpec
		},
	)
}

func NewRetributionPaladin(character *core.Character, options *proto.Player) *RetributionPaladin {
	retOptions := options.GetRetributionPaladin()

	pal := paladin.NewPaladin(character, options.TalentsString)

	ret := &RetributionPaladin{
		Paladin: pal,
		Seal:    retOptions.Options.Seal,
	}

	ret.PaladinAura = retOptions.Options.Aura

	ret.EnableAutoAttacks(ret, core.AutoAttackOptions{
		MainHand:       ret.WeaponFromMainHand(0), // Set crit multiplier later when we have targets.
		AutoSwingMelee: true,
	})

	return ret
}

type RetributionPaladin struct {
	*paladin.Paladin

	Seal proto.PaladinSeal
}

func (ret *RetributionPaladin) GetPaladin() *paladin.Paladin {
	return ret.Paladin
}

func (ret *RetributionPaladin) Initialize() {
	ret.Paladin.Initialize()
	ret.RegisterAvengingWrathCD()
	ret.applyWhitemaneBuffs()
}

// wotlksim: Retribution changes on Whitemane Frostmourne Rebuffed.
func (ret *RetributionPaladin) applyWhitemaneBuffs() {
	crit := func(percent float64) float64 { return percent * core.CritRatingPerCritChance }

	// +1% damage and +4% crit chance on everything.
	ret.PseudoStats.DamageDealtMultiplier *= 1.01
	ret.AddStats(stats.Stats{stats.MeleeCrit: crit(4), stats.SpellCrit: crit(4)})

	// Auto attacks: +8% damage and +5% crit chance.
	ret.AutoAttacks.MHConfig().DamageMultiplier *= 1.08
	ret.AutoAttacks.MHConfig().BonusCritRating += crit(5)

	// Consecration: +6% damage.
	if ret.Consecration != nil {
		ret.Consecration.DamageMultiplier *= 1.06
		// Whitemane: about 80% more Consecration casts. The sim keeps the rotation and counts
		// every cast as 1.8 casts (casts, hits and damage x1.8) at the end of each iteration.
		ret.Consecration.MetricsScale = 1.8
	}

	// Divine Storm and Hand of Reckoning: +5% crit chance.
	for _, spell := range []*core.Spell{ret.DivineStorm, ret.HandOfReckoning} {
		if spell != nil {
			spell.BonusCritRating += crit(5)
		}
	}
}

func (ret *RetributionPaladin) Reset(sim *core.Simulation) {
	ret.Paladin.Reset(sim)

	switch ret.Seal {
	case proto.PaladinSeal_Vengeance:
		ret.CurrentSeal = ret.SealOfVengeanceAura
		ret.SealOfVengeanceAura.Activate(sim)
	case proto.PaladinSeal_Command:
		ret.CurrentSeal = ret.SealOfCommandAura
		ret.SealOfCommandAura.Activate(sim)
	case proto.PaladinSeal_Righteousness:
		ret.CurrentSeal = ret.SealOfRighteousnessAura
		ret.SealOfRighteousnessAura.Activate(sim)
	}
}
