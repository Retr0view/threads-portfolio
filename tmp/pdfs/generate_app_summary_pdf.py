from pathlib import Path

OUT = Path('output/pdf/threads-portfolio-app-summary.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 612, 792  # Letter size in points
left = 54
start_y = 750
line_h = 14

lines = [
    ('title', 'Threads Portfolio App Summary'),
    ('sp', ''),
    ('h', 'What It Is'),
    ('p', 'A single-page portfolio web app for Rian Touag, built with Next.js App Router and TypeScript.'),
    ('p', 'It presents project work, designer profile details, and social links with animation-heavy UI interactions.'),
    ('sp', ''),
    ('h', 'Who It\'s For'),
    ('p', 'Primary persona: recruiters, hiring managers, founders, and collaborators evaluating a senior product designer.'),
    ('sp', ''),
    ('h', 'What It Does'),
    ('b', 'Displays an animated intro with profile info, last-updated date, and social links.'),
    ('b', 'Renders portfolio work groups from structured data in `lib/work-groups.ts`.'),
    ('b', 'Provides draggable project image carousels with responsive sizing and gesture handling.'),
    ('b', 'Opens desktop image lightboxes with keyboard navigation and preloading.'),
    ('b', 'Supports theme selection via `next-themes` with system preference initialization.'),
    ('b', 'Generates SEO metadata, structured data, sitemap output, robots file, and web manifest.'),
    ('b', 'Tracks interactions using a visitors script (`cdn.visitors.now`) and typed `window.visitors` events.'),
    ('sp', ''),
    ('h', 'How It Works (Repo-Evidenced Architecture)'),
    ('b', 'UI layer: Next.js App Router (`app/layout.tsx`, `app/page.tsx`) composes intro + work sections.'),
    ('b', 'Component layer: `components/` manages smooth scroll (Lenis), carousels, lightbox, and theme wrappers.'),
    ('b', 'Data/config layer: `lib/work-groups.ts`, `lib/site-config.ts`, constants, hooks, and image utilities.'),
    ('b', 'Build-time scripts: `scripts/generate-blur-placeholders.js` and `scripts/get-last-commit-date.js` produce JSON used at runtime.'),
    ('b', 'Static assets: project images/logos/icons/profile files under `public/` consumed via Next/Image or @unpic/react.'),
    ('b', 'External services: visitors analytics script loaded in layout; no internal API routes found.'),
    ('b', 'Persistent database or backend service: Not found in repo.'),
    ('sp', ''),
    ('h', 'How To Run (Minimal)'),
    ('n', '1. Install dependencies: `npm install`'),
    ('n', '2. Start dev server: `npm run dev`'),
    ('n', '3. Open `http://localhost:3000` in a browser.'),
]


def esc(text: str) -> str:
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

content = []
y = start_y

for kind, text in lines:
    if kind == 'sp':
        y -= 6
        continue
    if kind == 'title':
        content.append('BT /F1 18 Tf 0 g 54 %d Td (%s) Tj ET' % (y, esc(text)))
        y -= 24
    elif kind == 'h':
        content.append('BT /F1 12 Tf 0 g 54 %d Td (%s) Tj ET' % (y, esc(text.upper())))
        y -= line_h
    elif kind == 'p':
        content.append('BT /F1 10 Tf 0 g 54 %d Td (%s) Tj ET' % (y, esc(text)))
        y -= line_h
    elif kind == 'b':
        content.append('BT /F1 10 Tf 0 g 62 %d Td (\\225 %s) Tj ET' % (y, esc(text)))
        y -= line_h
    elif kind == 'n':
        content.append('BT /F1 10 Tf 0 g 62 %d Td (%s) Tj ET' % (y, esc(text)))
        y -= line_h

stream = '\n'.join(content).encode('latin-1', 'replace')

objs = []

def add_obj(data: bytes):
    objs.append(data)

add_obj(b'<< /Type /Catalog /Pages 2 0 R >>')
add_obj(b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
add_obj(f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'.encode())
add_obj(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
add_obj(b'<< /Length %d >>\nstream\n' % len(stream) + stream + b'\nendstream')

pdf = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
offsets = [0]
for i, obj in enumerate(objs, start=1):
    offsets.append(len(pdf))
    pdf.extend(f'{i} 0 obj\n'.encode())
    pdf.extend(obj)
    pdf.extend(b'\nendobj\n')

xref_pos = len(pdf)
pdf.extend(f'xref\n0 {len(objs)+1}\n'.encode())
pdf.extend(b'0000000000 65535 f \n')
for off in offsets[1:]:
    pdf.extend(f'{off:010d} 00000 n \n'.encode())

pdf.extend(f'trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n'.encode())

OUT.write_bytes(pdf)
print(f'Wrote {OUT}')
print(f'Final y position: {y}')
