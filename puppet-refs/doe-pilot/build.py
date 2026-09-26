import json,sys
P=json.load(open('parts.json')); art=open('art.txt').read()
dbg=len(sys.argv)>1
tint={'head':'#a0f','farHind':'#0af','farFront':'#0fa','tail':'#f0f','neck':'#fa0','earL':'#f00','earR':'#f60','nearHind':'#00f','nearFront':'#080'}
pts=lambda h:' '.join(f'{x},{y}' for x,y in h)
defs='<g id="art">'+art+'</g>'
defs+='<mask id="m-torso" maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="2048"><rect width="2048" height="2048" fill="#fff"/>'+''.join(f'<polygon points="{pts(p.get("cut",p["hull"]))}" fill="#000"/>' for p in P)+'</mask>'
for p in P:
    # a part's clip = its hull + cap, minus its own children's hulls (children draw themselves)
    def desc(n): 
        out=[k for k in P if k.get('parent')==n]
        for k in list(out): out+=desc(k['name'])
        return out
    kids=desc(p['name'])
    cx,cy,r=p['cap']
    defs+=f'<mask id="m-{p["name"]}" maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="2048"><polygon points="{pts(p["hull"])}" fill="#fff"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>'+(f'<polygon points="{pts(p["extra"])}" fill="#fff"/>' if p.get('extra') else '')+''.join(f'<polygon points="{pts(k["hull"])}" fill="#000"/>' for k in kids)+'</mask>'
def part(p):
    kids=sorted([k for k in P if k.get('parent')==p['name']],key=lambda k:k['z'])
    t=f' <rect width="2048" height="2048" fill="{tint[p["name"]]}" opacity=".35" mask="url(#m-{p["name"]})"/>' if dbg else ''
    return f'<g id="p-{p["name"]}" data-pivot="{p["pivot"][0]},{p["pivot"][1]}">'+''.join(part(k) for k in kids if k['z']<0)+f'<use href="#art" mask="url(#m-{p["name"]})"/>{t}'+''.join(part(k) for k in kids if k['z']>=0)+'</g>'
top=[p for p in P if not p.get('parent')]
body=''.join(part(p) for p in sorted(top,key=lambda p:p['z']) if p['z']<0)+'<use href="#art" mask="url(#m-torso)"/>'+''.join(part(p) for p in sorted(top,key=lambda p:p['z']) if p['z']>0)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="200 150 1800 1750" id="doe"><defs>{defs}</defs>{body}</svg>'
open('doe-rig.svg' if not dbg else 'doe-rig-debug.svg','w').write(svg)
