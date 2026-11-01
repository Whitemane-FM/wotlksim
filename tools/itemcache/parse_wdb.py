# wotlksim: reads a WoW 3.3.5 itemcache.wdb (Cache/WDB/<locale>/itemcache.wdb) into JSON.
# Usage: python3 tools/itemcache/parse_wdb.py itemcache.wdb items.json
import struct, sys, json

def parse(path):
    data = open(path, 'rb').read()
    magic, build, locale, unk1, unk2, ver = struct.unpack_from('<4sI4sIII', data, 0)
    pos = 24
    items = {}
    while pos + 8 <= len(data):
        entry, size = struct.unpack_from('<II', data, pos); pos += 8
        if entry == 0 and size == 0: break
        rec = data[pos:pos+size]; pos += size
        try:
            items[entry] = parse_item(rec)
        except Exception as e:
            items[entry] = {'error': str(e)}
    return (magic, build), items

def parse_item(r):
    p = 0
    def u(fmt):
        nonlocal p
        v = struct.unpack_from('<'+fmt, r, p); p += struct.calcsize('<'+fmt)
        return v if len(v) > 1 else v[0]
    def cs():
        nonlocal p
        e = r.index(b'\0', p); s = r[p:e].decode('utf-8', 'replace'); p = e+1; return s
    it = {}
    it['class'], it['subclass'], _ = u('IIi')
    names = [cs() for _ in range(4)]
    it['name'] = names[0]
    it['displayId'], it['quality'], it['flags'], it['flags2'], it['buy'], it['sell'], it['invType'] = u('IIIIiII')
    it['classes'], it['races'], it['ilvl'], it['reqLevel'] = u('iiII')
    u('IIIIIII')  # skill, skillrank, spell, honorrank, cityrank, repfaction, reprank
    it['maxCount'], it['stack'], it['containerSlots'], n = u('iiII')
    it['stats'] = [list(u('ii')) for _ in range(n)]
    u('II')  # scaling
    it['dmg'] = [list(u('ffI')) for _ in range(2)]
    it['armor'], *res = u('IIIIIII')
    it['delay'], _, _ = u('IIf')
    it['spells'] = []
    for _ in range(5):
        sid, trig, ch, cd, cat, catcd = u('iiiiii')
        if sid > 0: it['spells'].append([sid, trig, cd, catcd])
    it['bonding'] = u('I')
    it['description'] = cs()
    u('IIIIII')  # pagetext, lang, pagematerial, startquest, lock, material
    it['sheath'], _, _, it['block'], it['itemSet'], it['durability'] = u('IiIIII')
    u('IIII')  # area, map, bagfamily, totemcategory
    it['sockets'] = [u('II')[0] for _ in range(3)]
    it['socketBonus'] = u('I')
    return it

if __name__ == '__main__':
    hdr, items = parse(sys.argv[1])
    print(hdr, len(items), sum(1 for v in items.values() if 'error' in v))
    for k in (40471, 45931, 46095):
        print(k, json.dumps(items.get(k))[:600])
    json.dump(items, open(sys.argv[2], 'w'))
