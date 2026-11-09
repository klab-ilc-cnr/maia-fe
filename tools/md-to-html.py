#!/usr/bin/env python3
"""
Converts a simple markdown file (headings, bullet lists, paragraphs, horizontal rules, `code`, **bold**, _italic_) into a
self-contained HTML page (no external files), with an index of the "##" sections.

Usage: python3 tools/md-to-html.py documentation/upgrade/correzioni-post-upgrade.md [output.html]
Without the second argument the .html is written next to the .md.
Used for documentation/upgrade/correzioni-post-upgrade.md: regenerate the .html every time the .md is changed.
"""
import html
import re
import sys
from pathlib import Path


def inline(text: str) -> str:
    out = html.escape(text, quote=False)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"(?<![\w])_([^_]+)_(?![\w])", r"<em>\1</em>", out)
    return out


def slug(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower(), flags=re.UNICODE)
    return re.sub(r"[\s_]+", "-", s).strip("-")


def convert(md: str):
    body, toc = [], []
    paragraph, in_list = [], False
    title = "Documento"

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            body.append("<p>" + inline(" ".join(paragraph)) + "</p>")
            paragraph = []

    def close_list():
        nonlocal in_list
        if in_list:
            body.append("</ul>")
            in_list = False

    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush_paragraph(); close_list(); continue
        m = re.match(r"^(#{1,3})\s+(.*)$", line)
        if m:
            flush_paragraph(); close_list()
            level, text = len(m.group(1)), m.group(2).strip()
            if level == 1:
                title = re.sub(r"[`*_]", "", text)
            anchor = slug(text)
            if level == 2:
                toc.append((anchor, text))
            body.append(f'<h{level} id="{anchor}">{inline(text)}</h{level}>')
            continue
        if re.match(r"^-{3,}$", line.strip()):
            flush_paragraph(); close_list(); body.append("<hr>"); continue
        m = re.match(r"^\s*[-*]\s+(.*)$", line)
        if m:
            flush_paragraph()
            if not in_list:
                body.append("<ul>"); in_list = True
            body.append("<li>" + inline(m.group(1)) + "</li>")
            continue
        close_list()
        paragraph.append(line.strip())
    flush_paragraph(); close_list()
    return title, body, toc


CSS = """
:root { --fg:#1f2933; --muted:#6b7280; --accent:#b91c1c; --bg:#ffffff; --card:#f8fafc; --line:#e5e7eb; }
* { box-sizing: border-box; }
body { margin:0; font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--fg); background:var(--bg); }
.layout { display:flex; gap:2rem; max-width:1100px; margin:0 auto; padding:1.5rem; }
nav { flex:0 0 250px; position:sticky; top:1rem; align-self:flex-start; max-height:calc(100vh - 2rem); overflow:auto; font-size:.9rem;
      background:var(--card); border:1px solid var(--line); border-radius:8px; padding:.75rem 1rem; }
nav h2 { margin:.2rem 0 .5rem; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); border:0; }
nav a { display:block; padding:.25rem 0; color:var(--fg); text-decoration:none; }
nav a:hover { color:var(--accent); }
main { flex:1; min-width:0; }
h1 { font-size:1.7rem; margin:.2rem 0 1rem; }
h2 { font-size:1.3rem; margin:2rem 0 .6rem; padding-bottom:.3rem; border-bottom:2px solid var(--accent); }
h3 { font-size:1.05rem; margin:1.3rem 0 .3rem; color:var(--accent); }
ul { margin:.3rem 0 .8rem; padding-left:1.3rem; }
li { margin:.2rem 0; }
code { background:#eef2f7; padding:.1rem .35rem; border-radius:4px; font:0.9em ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
hr { border:0; border-top:1px solid var(--line); margin:1.5rem 0; }
@media (max-width: 800px) { .layout { display:block; } nav { position:static; margin-bottom:1rem; max-height:none; } }
@media print { nav { display:none; } .layout { display:block; } }
"""


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_suffix(".html")
    title, body, toc = convert(src.read_text(encoding="utf-8"))
    # index labels: only the part before " — " (e.g. the version, without the name of the package)
    nav = "".join(f'<a href="#{a}">{inline(re.split(r"\s+—\s+", t)[0])}</a>' for a, t in toc)
    page = f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>{CSS}</style>
</head>
<body>
<div class="layout">
<nav><h2>Indice</h2>{nav}</nav>
<main>
{chr(10).join(body)}
</main>
</div>
</body>
</html>
"""
    dst.write_text(page, encoding="utf-8")
    print(f"{dst} ({len(body)} blocchi, {len(toc)} sezioni)")


if __name__ == "__main__":
    main()
