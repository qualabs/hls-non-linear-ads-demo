import sys, colorsys, glob, os
sys.path.insert(0,'.')
from de import d, hex2lab, de00
import itertools
res={}
for p in sorted(glob.glob("px-*.raw")):
    name=os.path.basename(p)[3:-4]
    b=open(p,'rb').read(); n=len(b)//3
    acc=[0,0,0]; c=0
    for i in range(n):
        r,g,bl=b[3*i],b[3*i+1],b[3*i+2]
        h,s,v=colorsys.rgb_to_hsv(r/255,g/255,bl/255)
        if s>0.35 and v>0.25:
            acc[0]+=r; acc[1]+=g; acc[2]+=bl; c+=1
    if c==0: print(name,"sin pixeles saturados"); continue
    hexv='#%02X%02X%02X'%(round(acc[0]/c),round(acc[1]/c),round(acc[2]/c))
    res[name]=(hexv,c,n)
PEDIDO={"1-caldrix":"#F2DC12","2-marvok":"#A63DE8","3-noctev":"#10D9B0","4-runtak":"#96125C","5-pentav":"#3D9E2E","6-quentra":"#8B6E18"}
print("color DOMINANTE medido sobre la ficha (media de los pixeles con S>0.35 y V>0.25)\n")
for k,(hexv,c,n) in res.items():
    print(f"  {k:12s} medido {hexv}   pedido {PEDIDO[k]}   dE00(medido,pedido) = {d(hexv,PEDIDO[k]):5.1f}   ({100*c/n:.0f}% del cuadro)")
print("\ndistancias MUTUAS sobre los colores MEDIDOS:")
m=(999,None)
for a,b2 in itertools.combinations(res,2):
    v=d(res[a][0],res[b2][0]); print(f"  {a:12s} vs {b2:12s} {v:6.1f}")
    if v<m[0]: m=(v,(a,b2))
print(f"  --> MIN MUTUA MEDIDA = {m[0]:.1f}  {m[1]}")
