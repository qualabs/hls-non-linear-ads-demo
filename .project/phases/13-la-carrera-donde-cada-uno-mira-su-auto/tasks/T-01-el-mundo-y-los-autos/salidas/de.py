import math, itertools, sys
def srgb2lin(c):
    c=c/255.0
    return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def hex2lab(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16) for i in (0,2,4)]
    R,G,B=srgb2lin(r),srgb2lin(g),srgb2lin(b)
    X=0.4124564*R+0.3575761*G+0.1804375*B
    Y=0.2126729*R+0.7151522*G+0.0721750*B
    Z=0.0193339*R+0.1191920*G+0.9503041*B
    Xn,Yn,Zn=0.95047,1.0,1.08883
    def f(t): return t**(1/3) if t>216/24389 else (841/108)*t+4/29
    fx,fy,fz=f(X/Xn),f(Y/Yn),f(Z/Zn)
    return (116*fy-16, 500*(fx-fy), 200*(fy-fz))
def de00(l1,l2):
    L1,a1,b1=l1; L2,a2,b2=l2
    C1=math.hypot(a1,b1); C2=math.hypot(a2,b2); Cb=(C1+C2)/2
    G=0.5*(1-math.sqrt(Cb**7/(Cb**7+25**7))) if Cb>0 else 0.5
    a1p,a2p=(1+G)*a1,(1+G)*a2
    C1p,C2p=math.hypot(a1p,b1),math.hypot(a2p,b2)
    h1p=math.degrees(math.atan2(b1,a1p))%360 if (a1p or b1) else 0
    h2p=math.degrees(math.atan2(b2,a2p))%360 if (a2p or b2) else 0
    dLp=L2-L1; dCp=C2p-C1p
    if C1p*C2p==0: dhp=0
    elif abs(h2p-h1p)<=180: dhp=h2p-h1p
    elif h2p-h1p>180: dhp=h2p-h1p-360
    else: dhp=h2p-h1p+360
    dHp=2*math.sqrt(C1p*C2p)*math.sin(math.radians(dhp)/2)
    Lbp=(L1+L2)/2; Cbp=(C1p+C2p)/2
    if C1p*C2p==0: hbp=h1p+h2p
    elif abs(h1p-h2p)<=180: hbp=(h1p+h2p)/2
    elif h1p+h2p<360: hbp=(h1p+h2p+360)/2
    else: hbp=(h1p+h2p-360)/2
    T=1-0.17*math.cos(math.radians(hbp-30))+0.24*math.cos(math.radians(2*hbp))+0.32*math.cos(math.radians(3*hbp+6))-0.20*math.cos(math.radians(4*hbp-63))
    dTh=30*math.exp(-(((hbp-275)/25)**2))
    Rc=2*math.sqrt(Cbp**7/(Cbp**7+25**7)) if Cbp>0 else 0
    Sl=1+(0.015*(Lbp-50)**2)/math.sqrt(20+(Lbp-50)**2); Sc=1+0.045*Cbp; Sh=1+0.015*Cbp*T
    Rt=-math.sin(math.radians(2*dTh))*Rc
    return math.sqrt((dLp/Sl)**2+(dCp/Sc)**2+(dHp/Sh)**2+Rt*(dCp/Sc)*(dHp/Sh))
def d(h1,h2): return de00(hex2lab(h1),hex2lab(h2))
