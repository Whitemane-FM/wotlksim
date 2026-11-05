#!/usr/bin/env python3
"""wotlksim: regenerates the upgrade level / epic version data.

Inputs:
  assets/db_inputs/wotlk_upgrade_chains.json   upgrade chains and [base, epic version] pairs
  assets/db_inputs/wotlk_upgrade_items.json    the variant items themselves
  assets/db_inputs/whitemane2_items.json       optional: Whitemane 2 item export from
                                               eysie101/wowsim-rebuffed (stats, effect texts, effect scales)
  assets/db_inputs/wowhead_item_tooltips.csv   tooltips of the base items (their special effect texts)

Outputs:
  assets/db_inputs/wotlk_upgrade_items.json    epic version stats updated from the Whitemane 2 export
  assets/db_inputs/wotlk_variant_effects.json  special effect lines for the custom tooltips
  sim/core/upgrade_items.go                    base item and effect scale of every variant

Usage: python3 tools/gen_variant_items.py [path/to/whitemane2_items.json]
"""

import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUTS = os.path.join(ROOT, 'assets', 'db_inputs')


def load(name):
    with open(os.path.join(INPUTS, name)) as f:
        return json.load(f)


STAT_LINE = re.compile(
    r'^Equip: (?:Improves|Increases) (?:your )?(?:attack power|spell power|critical strike rating|hit rating|haste rating|'
    r'expertise rating|armor penetration rating|defense rating|dodge rating|parry rating|block rating|'
    r'the block value of your shield|block value|spell penetration|resilience rating) by \d+\.$'
    r'|^Equip: Restores \d+ mana per 5 sec\.$'
)


def special_effect_lines(tooltip_html):
    """Green Equip/Use/Chance on hit lines that are special effects (not plain stat lines)."""
    lines = []
    for span in re.findall(r'<span class="q2">(.*?)</span>(?=<br>|<!--|<div|$)', tooltip_html, re.S):
        if '<a ' not in span and not span.startswith(('Use:', 'Chance on hit:')):
            continue  # plain stat line ("Equip: Improves critical strike rating by 74."), built from the stats
        text = html.unescape(re.sub(r'<[^>]+>', '', span)).strip()
        if text and not STAT_LINE.match(text):
            lines.append(text)
    return lines


EFFECT_AMOUNT = re.compile(r'(?<![\d.])(\d{2,})(?![\d.%])(?! sec)(?! min)(?! seconds)(?! minutes)(?! yards)(?! times)')


def scale_effect_text(text, scale):
    """Scales the effect amounts (numbers of 2+ digits that aren't durations or percentages) of an
    effect text; used for estimated effect scales."""
    return EFFECT_AMOUNT.sub(lambda m: str(round(int(m.group(1)) * scale)), text)


SET_HEADER = re.compile(r'<a href="/wotlk/item-set=[^"]*" class="q">([^<]*)</a> \((\d+)/(\d+)\)')
SET_PIECE = re.compile(r'<a href="/wotlk/item=\d+[^"]*">([^<]*)</a>')
SET_BONUS = re.compile(r'<span>\((\d+)\) Set : (.*?)</span>(?=<br />|</span>)', re.S)


def set_tooltip(tooltip_html):
    """Set name, pieces and bonuses from a Wowhead item tooltip, or None."""
    header = SET_HEADER.search(tooltip_html)
    if not header:
        return None
    rest = tooltip_html[header.end():]
    pieces_html = rest.split('</div>', 1)[0]
    pieces = [html.unescape(name) for name in SET_PIECE.findall(pieces_html)]
    bonuses = [[int(n), html.unescape(re.sub(r'<[^>]+>', '', text)).strip()] for n, text in SET_BONUS.findall(rest)]
    return {'name': html.unescape(header.group(1)), 'pieces': pieces, 'bonuses': bonuses}


def write_set_tooltips(base_of):
    """Set names, pieces and bonuses for the custom tooltips of upgrade levels, epic versions and
    original item level versions (they keep the set of their base item)."""
    with open(os.path.join(ROOT, 'assets', 'database', 'db.json')) as f:
        db_items = {item['id']: item for item in json.load(f)['items']}
    wanted = set(base_of.values())
    with open(os.path.join(INPUTS, 'ulduar_base_items.json')) as f:
        wanted |= {item['id'] - BASE_VERSION_ID_OFFSET for item in json.load(f)['items']}
    by_set = {}
    for item_id in wanted:
        set_name = db_items.get(item_id, {}).get('setName')
        if set_name:
            by_set.setdefault(set_name, set()).add(item_id)
    item_to_set = {item_id: name for name, ids in by_set.items() for item_id in ids}

    # 10 and 25 player versions of a set share the set name in the sim, but their pieces have
    # different names (Heroes' / Valorous), so every item points to its own displayed set.
    sets = {}
    items = {}
    with open(os.path.join(INPUTS, 'wowhead_item_tooltips.csv')) as f:
        for line in f:
            item_id, _, data = line.partition(',')
            if not item_id.isdigit() or int(item_id) not in item_to_set:
                continue
            parsed = set_tooltip(json.loads(data).get('tooltip', ''))
            if parsed and parsed['pieces']:
                sets[parsed['name']] = {'pieces': parsed['pieces'], 'bonuses': parsed['bonuses']}
                items[item_id] = parsed['name']

    with open(os.path.join(INPUTS, 'wotlk_set_tooltips.json'), 'w') as f:
        json.dump({'sets': dict(sorted(sets.items())), 'items': dict(sorted(items.items(), key=lambda kv: int(kv[0])))}, f, indent=1)
    print(f'{len(sets)} displayed sets for {len(items)} items ({len(by_set)} sim item sets)')


BASE_VERSION_ID_OFFSET = 10_000_000


def main():
    whitemane_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(INPUTS, 'whitemane2_items.json')
    whitemane = {}
    if os.path.exists(whitemane_path):
        with open(whitemane_path) as f:
            whitemane = {item['id']: item for item in json.load(f)['items']}

    chains = load('wotlk_upgrade_chains.json')
    items = load('wotlk_upgrade_items.json')

    base_of = {}
    for chain in chains['chains'] + chains['epicVariants']:
        for variant_id in chain[1:]:
            base_of[variant_id] = chain[0]
    # Upgrade levels of an epic version (dungeon items: blue -> epic 200 -> +1 213 -> +2 232)
    # use the effect of the original (blue) item, so resolve every variant to its root item.
    def root_of(item_id):
        seen = set()
        while item_id in base_of and item_id not in seen:
            seen.add(item_id)
            item_id = base_of[item_id]
        return item_id
    chain_parent = dict(base_of)
    base_of = {variant_id: root_of(variant_id) for variant_id in base_of}

    # Epic version stats from the Whitemane 2 export (the upgrade levels already come from it).
    item_fields = set(k for item in items for k in item)
    for i, item in enumerate(items):
        wm = whitemane.get(item['id'])
        if wm and wm.get('epicVariant') and wm.get('variantBaseId') == base_of.get(item['id']):
            items[i] = {k: v for k, v in wm.items() if k in item_fields}

    # Special effect texts of the base items, from the Wowhead tooltips.
    wanted = set(base_of.values())
    base_texts = {}
    with open(os.path.join(INPUTS, 'wowhead_item_tooltips.csv')) as f:
        for line in f:
            item_id, _, data = line.partition(',')
            if item_id.isdigit() and int(item_id) in wanted:
                base_texts[int(item_id)] = special_effect_lines(json.loads(data).get('tooltip', ''))

    # Effect scales estimated from the item's stat budget for versions the Whitemane 2 export
    # doesn't have (dungeon item upgrade levels read from the game client's item cache).
    estimated_path = os.path.join(INPUTS, 'wotlk_estimated_effect_scales.json')
    estimated = {}
    if os.path.exists(estimated_path):
        with open(estimated_path) as f:
            estimated = {int(k): v for k, v in json.load(f).items()}

    effects = {}
    scales = {}
    for variant_id, base_id in sorted(base_of.items()):
        wm = whitemane.get(variant_id, {})
        scale = wm.get('effectScale') or estimated.get(variant_id)
        texts = wm.get('effectTexts')
        if not texts:
            texts = base_texts.get(base_id) or []
            parent_texts = whitemane.get(chain_parent.get(variant_id), {}).get('effectTexts')
            if variant_id in estimated and parent_texts:
                texts = parent_texts
            if variant_id in estimated:
                texts = [scale_effect_text(text, scale / (whitemane.get(chain_parent.get(variant_id), {}).get('effectScale') or 1) if parent_texts else scale) for text in texts]
        if texts:
            effects[str(variant_id)] = texts
        if scale:
            scales[variant_id] = scale

    write_set_tooltips(base_of)

    with open(os.path.join(INPUTS, 'wotlk_upgrade_items.json'), 'w') as f:
        json.dump(items, f, indent=1)
    with open(os.path.join(INPUTS, 'wotlk_variant_effects.json'), 'w') as f:
        json.dump(effects, f, indent=1)

    go = [
        'package core',
        '',
        '// Code generated by tools/gen_variant_items.py. DO NOT EDIT.',
        '',
        '// wotlksim: upgrade levels (+1 ... +5) and epic versions of items, mapped to their base item.',
        "// They share the base item's special effects (trinket procs, weapon procs, ...).",
        'var UpgradeBaseItemIDs = map[int32]int32{',
    ]
    go += [f'\t{variant_id}: {base_id},' for variant_id, base_id in sorted(base_of.items())]
    go += [
        '}',
        '',
        "// Factor for the amounts of the base item's effect on the better versions (from Whitemane 2),",
        '// e.g. the epic Meteorite Whetstone: 509 instead of 444 haste rating.',
        'var ItemEffectScales = map[int32]float64{',
    ]
    go += [f'\t{variant_id}: {scale},' for variant_id, scale in sorted(scales.items())]
    go += ['}', '']
    with open(os.path.join(ROOT, 'sim', 'core', 'upgrade_items.go'), 'w') as f:
        f.write('\n'.join(go))

    print(f'{len(base_of)} variants, {len(effects)} with effect texts, {len(scales)} with effect scales')


if __name__ == '__main__':
    main()
