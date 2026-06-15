# -*- coding: utf-8 -*-
import zipfile, os

import os as _os
unp = r"C:\My Projects\E-Magios-Core-Site\diploma\v1\_unpacked_v2"
out = _os.environ.get("PPTX_OUT",
    r"C:\My Projects\E-Magios-Core-Site\diploma\v1\221_3711_ГайдарьМД_Диплом_Презентация_v3.pptx")

files = []
for root, _, fs in os.walk(unp):
    for f in fs:
        full = os.path.join(root, f)
        arc = os.path.relpath(full, unp).replace(os.sep, "/")
        files.append((full, arc))

files.sort(key=lambda t: (t[1] != "[Content_Types].xml", t[1]))

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for full, arc in files:
        z.write(full, arc)

print("PACKED:", out, "files:", len(files))
