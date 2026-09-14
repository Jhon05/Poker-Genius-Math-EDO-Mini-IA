#!/usr/bin/env python3
"""Build a single-SCO SCORM ZIP from this complete package; Python stdlib only."""
from __future__ import annotations
import argparse
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
CP='http://www.imsproject.org/xsd/imscp_rootv1p1p2'
ADL='http://www.adlnet.org/xsd/adlcp_rootv1p2'
ET.register_namespace('',CP);ET.register_namespace('adlcp',ADL)
def included_paths():
    for p in sorted(ROOT.rglob('*')):
        rel=p.relative_to(ROOT)
        if p.is_symlink():
            raise ValueError(f'No se permiten enlaces simbólicos: {rel}')
        if not p.is_file() or any((x.startswith('.') and x!='.nojekyll') or x=='__pycache__' for x in rel.parts):
            continue
        if p.suffix.lower() in {'.pyc','.pyo','.zip'}:
            continue
        yield p

def manifest():
    path=ROOT/'imsmanifest.xml'
    tree=ET.parse(path);root=tree.getroot()
    root.set('identifier','POKER_MATH_EDO_V722_SAFE_AUDITADA_GITHUB_BRIGHTSPACE_SCORM12');root.set('version','7.2.2')
    org=tree.find(f'.//{{{CP}}}organization/{{{CP}}}title')
    org.text='Poker Math EDO v7.2.2 · Genius Math seguro auditado · Corte 3 · Banco 500'
    item=tree.find(f'.//{{{CP}}}item/{{{CP}}}title')
    item.text='Poker Math EDO · Genius Math seguro · GitHub Pages y Brightspace'
    res=tree.find(f'.//{{{CP}}}resource')
    if res is None or res.get('href')!='index.html':raise ValueError('El lanzamiento debe ser index.html.')
    for child in list(res):
        if child.tag==f'{{{CP}}}file':res.remove(child)
    for p in included_paths():
        if p!=path:ET.SubElement(res,f'{{{CP}}}file',{'href':p.relative_to(ROOT).as_posix()})
    ET.indent(tree,space='  ');tree.write(path,encoding='utf-8',xml_declaration=True)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--manifest-only',action='store_true')
    ap.add_argument('--output',type=Path,default=ROOT.parent/'Poker_Math_EDO_v722_SAFE_AUDITADA_GITHUB_BRIGHTSPACE_SCORM12.zip')
    args=ap.parse_args();manifest()
    if args.manifest_only:print('Manifiesto actualizado.');return
    dest=args.output.expanduser().resolve()
    try:dest.relative_to(ROOT)
    except ValueError:pass
    else:raise ValueError('Guarda el ZIP fuera de la carpeta fuente para evitar auto-inclusión.')
    dest.parent.mkdir(parents=True,exist_ok=True)
    paths=list(included_paths())
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in paths:z.write(p,p.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(dest) as z:
        bad=z.testzip()
        if bad:raise RuntimeError('Entrada corrupta: '+bad)
        if 'imsmanifest.xml' not in z.namelist():raise RuntimeError('Falta manifiesto raíz.')
    print(f'ZIP creado: {dest}\nArchivos: {len(paths)}\nBytes: {dest.stat().st_size}')
if __name__=='__main__':main()
