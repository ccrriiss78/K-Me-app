from pathlib import Path
import json
import re
root = Path(__file__).resolve().parent

def piece(path):
    svg = path.read_text()
    return re.fullmatch(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)

parts = {str(path.relative_to(root)): piece(path) for path in sorted((root/'assets').rglob('*.svg'))}
data = json.dumps(parts, ensure_ascii=False).replace('</', '<\\/')
page = (root/'editor.template').read_text()
for key, value in [('COMPOSER',(root/'composer.js').read_text()),('MANIFEST',(root/'manifest.json').read_text()),('ASSETS',data)]:
    page = page.replace(f'/*{key}*/',value)
(root/'editor.html').write_text(page)
