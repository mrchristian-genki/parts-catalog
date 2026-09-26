import cv2, numpy as np, json, sys
src=sys.argv[1]; out=sys.argv[2]
PAL=['#bc7f53','#d49b6e','#ab7147','#f9e9d4','#65422d','#916240','#dec1a0']
P=np.array([[int(h[i:i+2],16) for i in (1,3,5)] for h in PAL],float)
rgb=cv2.cvtColor(cv2.imread(src),cv2.COLOR_BGR2RGB).astype(float)
H,W=rgb.shape[:2]
# silhouette: anything not near-white (cream is close to white: use saturation+value)
white=np.array([255,255,255.])
d_white=np.linalg.norm(rgb-white,axis=2)
d=np.stack([np.linalg.norm(rgb-c,axis=2) for c in P],2)
lab=d.argmin(2); dmin=d.min(2)
sil=(d_white>18)&(dmin<d_white)
sil=cv2.morphologyEx(sil.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
sil=cv2.morphologyEx(sil,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
lab=np.where(sil>0,lab,-1)
# majority clean-up: median on labels per region
lab2=cv2.medianBlur((lab+1).astype(np.uint8),7).astype(int)-1
lab2=np.where(sil>0,np.maximum(lab2,0),-1)
np.save(out+'.labels.npy',lab2)
def polys(mask,eps=1.6,minarea=60):
    cs,hier=cv2.findContours(mask.astype(np.uint8),cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
    d=''
    for c in cs:
        if cv2.contourArea(c)<minarea: continue
        a=cv2.approxPolyDP(c,eps,True).reshape(-1,2)
        d+='M'+' '.join(f'{x},{y}' for x,y in a)+'Z'
    return d
base=polys(sil>0,1.2,200)
paths=[('base',PAL[0],base)]
counts=np.bincount(lab2[lab2>=0].ravel(),minlength=len(PAL))
for i in np.argsort(-counts):
    if i==0: continue
    m=(lab2==i)
    m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    dd=polys(m)
    if dd: paths.append((f't{i}',PAL[i],dd))
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'+''.join(f'<path id="{n}" fill="{c}" fill-rule="evenodd" d="{d}"/>' for n,c,d in paths)+'</svg>'
open(out,'w').write(svg); print(len(svg)//1024,'KB', [(n,len(d)) for n,c,d in paths])
