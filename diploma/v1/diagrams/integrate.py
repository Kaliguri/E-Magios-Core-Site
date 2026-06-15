# -*- coding: utf-8 -*-
import re, shutil, os

BASE = r"C:\My Projects\E-Magios-Core-Site\diploma\v1"
UNP  = os.path.join(BASE, "_unpacked_v2")
DIAG = os.path.join(BASE, "diagrams")

def px(path):
    from PIL import Image
    with Image.open(path) as im:
        return im.size  # (w,h)

# --- slide size ---
pres = open(os.path.join(UNP, "ppt", "presentation.xml"), encoding="utf-8").read()
m = re.search(r'<p:sldSz cx="(\d+)" cy="(\d+)"', pres)
W, H = int(m.group(1)), int(m.group(2))
print("slide:", W, H)

IN = 914400
TOP = int(1.45*IN)
BOT = int(6.55*IN)
BAND_H = BOT - TOP
LM = int(0.5*IN)
USABLE_W = W - 2*LM

def fit(pw, ph, mw, mh):
    s = min(mw/pw, mh/ph)
    return int(pw*s), int(ph*s)

def set_geom(slide_no, new_png, target_media, off, ext):
    # overwrite media
    shutil.copy(new_png, os.path.join(UNP, "ppt", "media", target_media))
    p = os.path.join(UNP, "ppt", "slides", f"slide{slide_no}.xml")
    xml = open(p, encoding="utf-8").read()
    def repl_pic(mobj):
        blk = mobj.group(0)
        if 'r:embed="rId4"' not in blk:
            return blk
        blk = re.sub(r'<a:off x="-?\d+" y="-?\d+"/>',
                     f'<a:off x="{off[0]}" y="{off[1]}"/>', blk, count=1)
        blk = re.sub(r'<a:ext cx="\d+" cy="\d+"/>',
                     f'<a:ext cx="{ext[0]}" cy="{ext[1]}"/>', blk, count=1)
        return blk
    xml = re.sub(r'<p:pic>.*?</p:pic>', repl_pic, xml, flags=re.S)
    open(p, "w", encoding="utf-8").write(xml)
    return xml

# ---------- Slide 8: Architecture (full width, centered) ----------
pw, ph = px(os.path.join(DIAG, "architecture.png"))
w, h = fit(pw, ph, USABLE_W, BAND_H)
ox = (W - w)//2
oy = TOP + (BAND_H - h)//2
set_geom(8, os.path.join(DIAG, "architecture.png"), "image16.png", (ox, oy), (w, h))
print("arch:", (ox, oy), (w, h))

# ---------- Slide 9: ER (fit by height) ----------
pw, ph = px(os.path.join(DIAG, "er.png"))
w, h = fit(pw, ph, USABLE_W, BAND_H)
ox = (W - w)//2
oy = TOP + (BAND_H - h)//2
set_geom(9, os.path.join(DIAG, "er.png"), "image17.png", (ox, oy), (w, h))
print("er:", (ox, oy), (w, h))

# ---------- Slide 6: Use case is built natively via build_usecase.py ----------
print("DONE")
