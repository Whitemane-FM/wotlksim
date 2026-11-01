# wotlksim: converts itemcache.wdb items (parse_wdb.py output) to sim stat arrays and gem sockets.
import json
MOD = {3: [1], 4: [0], 5: [3], 6: [4], 7: [2], 12: [22], 13: [25], 14: [26], 15: [23], 31: [7, 12], 32: [8, 13],
       35: [27], 36: [9, 14], 37: [16], 38: [11, 21], 39: [21], 43: [6], 44: [15], 45: [5], 47: [10], 48: [24]}
SOCKET = {1: 1, 2: 2, 4: 4, 8: 3}

def stats_of(c):
    s = [0] * 35
    for t, v in c['stats']:
        for idx in MOD.get(t, []):
            s[idx] += v
    s[20] += c['armor']
    return s

def sockets_of(c):
    return [SOCKET[x] for x in c['sockets'] if x]
