import sys, itertools
sys.path.insert(0,'.')
from de import d
SET=dict(x.split('=') for x in sys.argv[1:])
DURO={"rojo":"#DC0000","papaya":"#FF8000","verde oscuro":"#1E5C3A","plateado":"#C0C0C0","azul":"#1E1E5A","cian":"#00BFFF"}
GRID={"papaya McLaren":"#FF8000","rojo Ferrari":"#DC0000","navy Red Bull":"#1E1E5A","plata Mercedes":"#C0C0C0",
 "verde Aston":"#229971","rosa Alpine":"#FF6FB5","azul Alpine":"#0055FF","azul Williams":"#1868DB",
 "teal Williams":"#0B7FA8","blanco RacingBulls":"#F2F2F2","azul RB":"#6C9BD2","rojo Audi":"#B3121B",
 "negro Haas":"#1A1A1A","plata Cadillac":"#B8B8B8","gris Cadillac":"#6E6E6E"}
print("mutuas:")
m=(999,None)
for a,b in itertools.combinations(SET,2):
    v=d(SET[a],SET[b]); print(f"   {a:12s} vs {b:12s} {v:6.1f}")
    if v<m[0]: m=(v,(a,b))
print(f"   MIN MUTUA = {m[0]:.1f}  ({m[1]})\n")
print("contra los cinco prohibidos / la parrilla 2026:")
for a in SET:
    dd=min(DURO,key=lambda k:d(SET[a],DURO[k])); gg=min(GRID,key=lambda k:d(SET[a],GRID[k]))
    print(f"   {a:12s} {SET[a]}  prohibido_min={d(SET[a],DURO[dd]):5.1f} ({dd})   parrilla_min={d(SET[a],GRID[gg]):5.1f} ({gg})")
