#!/usr/bin/env python3
"""Optional maintainer operation: vendor the actual, version-pinned upstream bundle.
Not run by the game. No package lifecycle scripts, credentials or model weights.
Network is required. Failure does not claim the runtime is bundled.
"""
from __future__ import annotations
import argparse, base64, hashlib, io, json, re, tarfile, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
VERSION = '0.2.85'
def fetch(url: str, limit: int) -> bytes:
    request = urllib.request.Request(url, headers={'User-Agent': 'PokerEDO-RuntimeVendor/7.2.1'})
    with urllib.request.urlopen(request, timeout=45) as response:
        if not response.url.startswith('https://'):
            raise ValueError('Se rechazo una redireccion sin HTTPS.')
        result = response.read(limit + 1)
        if len(result) > limit:
            raise ValueError('El recurso supera el limite de descarga.')
        return result
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--accept-upstream-license', action='store_true', required=True,
                        help='Confirmar lectura de la licencia Apache-2.0 upstream y avisos incluidos.')
    args = parser.parse_args()
    try:
        metadata = json.loads(fetch(f'https://registry.npmjs.org/@mlc-ai%2fweb-llm/{VERSION}', 1024*1024))
        if metadata.get('version') != VERSION or metadata.get('name') != '@mlc-ai/web-llm':
            raise ValueError('El registro no coincide con el paquete/version fijados.')
        dist = metadata['dist']; tarball = dist['tarball']
        if not tarball.startswith('https://registry.npmjs.org/'):
            raise ValueError('Tarball fuera del registro npm previsto.')
        data = fetch(tarball, 50*1024*1024)
        integrity = dist.get('integrity', '')
        if not integrity.startswith('sha512-') or base64.b64encode(hashlib.sha512(data).digest()).decode() != integrity[7:]:
            raise ValueError('La integridad SHA-512 no coincide con el registro npm.')
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
            def member(name: str) -> bytes:
                info = archive.getmember(name)
                if not info.isfile() or info.size > 40*1024*1024:
                    raise ValueError('Miembro no regular o demasiado grande: ' + name)
                return archive.extractfile(info).read()
            js = member('package/lib/index.js').decode('utf-8')
            license_text = member('package/LICENSE').decode('utf-8')
            package_json = member('package/package.json')
        if 'MLCEngine' not in js or 'prebuiltAppConfig' not in js:
            raise ValueError('El bundle no contiene las interfaces previstas.')
        imports = re.findall(r'(?:^|\n)\s*(?:import|export)\s+[^;]*?\bfrom\s*[\'"]([^\'"]+)', js)
        if imports:
            raise ValueError('El bundle conserva importaciones externas; requiere bundling adicional: ' + repr(imports))
        js = re.sub(r'\n?//# sourceMappingURL=.*?(?:\n|$)', '\n', js)
        config = (ROOT/'genie/config.js').read_text(encoding='utf-8')
        marker = 'G.config.localModel.runtimeBundled=false;'
        if marker not in config:
            raise ValueError('Configuracion ya modificada; revisala manualmente antes de volver a empaquetar.')
        dest = ROOT/'vendor/webllm'; dest.mkdir(parents=True, exist_ok=True)
        (dest/'index.js').write_text(js, encoding='utf-8')
        (dest/'LICENSE').write_text(license_text, encoding='utf-8')
        (dest/'package-upstream.json').write_bytes(package_json)
        evidence = {'version': VERSION, 'source': tarball, 'npmIntegrity': integrity,
                    'indexSHA256': hashlib.sha256(js.encode()).hexdigest(),
                    'bytes': len(js.encode()), 'liveInferenceExecuted': False,
                    'note': 'Vendoring no certifica inferencia ni elimina pesos/WASM externos.'}
        (dest/'VENDOR_EVIDENCE.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
        config = config.replace(marker, "G.config.localModel.runtimeBundled=true;\nG.config.localModel.runtimeURL=new URL('vendor/webllm/index.js',G.config.packageRoot).href;")
        (ROOT/'genie/config.js').write_text(config, encoding='utf-8')
        ns='http://www.imsproject.org/xsd/imscp_rootv1p1p2'; ET.register_namespace('',ns); ET.register_namespace('adlcp','http://www.adlnet.org/xsd/adlcp_rootv1p2')
        tree=ET.parse(ROOT/'imsmanifest.xml'); resource=tree.find('.//{'+ns+'}resource')
        known={x.get('href') for x in resource.findall('{'+ns+'}file')}
        for p in dest.iterdir():
            href=p.relative_to(ROOT).as_posix()
            if href not in known: ET.SubElement(resource,'{'+ns+'}file',href=href)
        ET.indent(tree); tree.write(ROOT/'imsmanifest.xml',encoding='utf-8',xml_declaration=True)
        print('Runtime real copiado y configurado. Conserva la licencia; repite pruebas antes de crear otro ZIP RC.')
        return 0
    except Exception as exc:
        print('No se completo el vendoring:', exc)
        print('No se declara runtimeBundled=true. Revisa red y documentacion; no se inventa un bundle.')
        return 1
if __name__ == '__main__':
    raise SystemExit(main())
