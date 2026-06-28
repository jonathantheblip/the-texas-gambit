#!/usr/bin/env python3
"""Edit gate for the compound model. Run after ANY change to compound_rooms.json
(whether Claude made it or it came back from the PWA 'Export JSON').
Re-checks the locks the v2 work established. Exit 0 = clean, 1 = a lock broke."""
import json, math, sys

P = sys.argv[1] if len(sys.argv) > 1 else "compound_rooms.json"
data = json.load(open(P)); rooms = data["rooms"]; L = data["meta"]["locks"]
by = {r["id"]: r for r in rooms}
def rect(r): return (r["x"], r["y"], r["x"]+r["w"], r["y"]+r["d"])
def rdist(a,b):
    A,B=rect(a),rect(b); dx=max(B[0]-A[2],A[0]-B[2],0); dy=max(B[1]-A[3],A[1]-B[3],0)
    return math.hypot(dx,dy)
def ovl(a,b):
    A,B=rect(a),rect(b)
    return max(0,min(A[2],B[2])-max(A[0],B[0]))*max(0,min(A[3],B[3])-max(A[1],B[1]))

# carved-child / open-to-above pairs that are allowed to overlap
ALLOW=set()
def add(n1,n2):
    a=next((r["id"] for r in rooms if r["name"]==n1),None)
    b=next((r["id"] for r in rooms if r["name"]==n2),None)
    if a and b: ALLOW.add(frozenset((a,b)))
add("Powder Room","Everyday Dining (N-ctr)")
add("Pink En-Suite (Aurelia)","Aurelia's Provincetown Suite (NW, over Oval)")
add("Rafa En-Suite","Rafa's Texas Room (SE, over Great)")
add("Podcast Studio","Loft")
add("Pool","Pool Terrace")

fails=[]
# guest suite total
gids=[next(r["id"] for r in rooms if r["name"]==n) for n in ("Guest Bedroom","Guest Sitting","Guest En-Suite")]
gs=sum(by[i]["w"]*by[i]["d"] for i in gids)
print(f"Guest Suite: {gs:.0f} ft2 / {L['guestSuiteTotal']} " + ("OK" if abs(gs-L['guestSuiteTotal'])<=5 else "FAIL"))
if abs(gs-L['guestSuiteTotal'])>5: fails.append("guest suite total")
# setbacks
obs=next(r for r in rooms if r["name"]=="Observatory tower"); pool=next(r for r in rooms if r["name"]=="Pool")
dp=rdist(obs,pool); mb=[r for r in rooms if r["building"]=="Motor Barn"]; dm=min(rdist(obs,m) for m in mb)
print(f"Observatory->pool: {dp:.0f}' (>={L['observatoryPoolMin']}) " + ("OK" if dp>=L['observatoryPoolMin'] else "FAIL"))
print(f"Observatory->Motor Barn: {dm:.0f}' (>={L['observatoryMotorBarnMin']}) " + ("OK" if dm>=L['observatoryMotorBarnMin'] else "FAIL"))
if dp<L['observatoryPoolMin']: fails.append("observatory-pool setback")
if dm<L['observatoryMotorBarnMin']: fails.append("observatory-motorbarn setback")
# overlaps
bad=[]
for i in range(len(rooms)):
    for j in range(i+1,len(rooms)):
        a,b=rooms[i],rooms[j]
        if a["building"]!=b["building"] or a["zFloor"]!=b["zFloor"]: continue
        if frozenset((a["id"],b["id"])) in ALLOW: continue
        if ovl(a,b)>0.5: bad.append(f"{a['name']} x {b['name']}")
print(f"Overlaps: {'none' if not bad else bad}")
if bad: fails.append("box overlaps")

print("\n" + ("ALL CHECKS PASS" if not fails else "BROKEN: "+", ".join(fails)))
sys.exit(0 if not fails else 1)
