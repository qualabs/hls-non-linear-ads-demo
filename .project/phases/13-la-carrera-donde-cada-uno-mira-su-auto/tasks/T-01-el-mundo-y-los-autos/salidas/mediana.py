import sys, colorsys, glob, os, itertools, statistics
sys.path.insert(0,'.')
from de import d
DURO={"rojo":"#DC0000","papaya":"#FF8000","verde oscuro":"#1E5C3A","plateado":"#C0C0C0","azul":"#1E1E5A","cian":"#00BFFF"}
GRID={"papaya McLaren":"#FF8000","rojo Ferrari":"#DC0000","navy Red Bull":"#1E1E5A","plata Mercedes":"#C0C0C0",
 "verde Aston":"#229971","rosa Alpine":"#FF6FB5","azul Alpine":"#0055FF","azul Williams":"#1868DB",
 "teal Williams":"#0B7FA8","blanco RacingBulls":"#F2F2F2","azul RB":"#6C9BD2","rojo Audi":"#B3121B",
 "negro Haas":"#1A1A1A","plata Cadillac":"#B8B8B8","gris Cadillac":"#6E6E6E"}
res={}
for p in sorted(glob.glob("px-*.raw")):
    name=os.path.basename(p)[3:-4]
    b=open(p,'rb').read(); n=len(b)//3
    R=[];G=[];B=[];H=[]
    for i in range(n):
        r,g,bl=b[3*i],b[3*i+1],b[3*i+2]
        h,s,v=colorsys.rgb_to_hsv(r/255,g/255,bl/255)
        if s>0.35 and v>0.25: R.append(r);G.append(g);B.append(bl);H.append(h*360)
    hexv='#%02X%02X%02X'%(round(statistics.median(R)),round(statistics.median(G)),round(statistics.median(B)))
    res[name]=(hexv, round(statistics.median(H)))
print("color de la carroceria, MEDIANA de los pixeles saturados\n")
for k,(hexv,hue) in res.items():
    dd=min(DURO,key=lambda x:d(hexv,DURO[x])); gg=min(GRID,key=lambda x:d(hexv,GRID[x]))
    print(f"  {k:12s} {hexv}  hue {hue:3d}deg   prohibido_min={d(hexv,DURO[dd]):5.1f} ({dd})  parrilla_min={d(hexv,GRID[gg]):5.1f} ({gg})")
print("\nmutuas:")
m=(999,None)
for a,b2 in itertools.combinations(res,2):
    v=d(res[a][0],res[b2][0]); print(f"  {a:12s} vs {b2:12s} {v:6.1f}")
    if v<m[0]: m=(v,(a,b2))
print(f"  --> MIN MUTUA = {m[0]:.1f}  {m[1]}")
