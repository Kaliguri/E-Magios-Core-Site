# -*- coding: utf-8 -*-
"""
Convert Markdown files from Obsidian Vault to HTML pages
Usage: python convert_md_to_html.py <input_md> <output_html> <book_code> <chapter_id>
"""
import sys
import re

from link_resolver import strip_wikilinks_to_text, convert_wikilinks_in_text

def convert_markdown_to_html(md_content, book_code='', base_prefix='../', allow_special_pages=True):
    """Convert markdown content to HTML."""
    lines = md_content.split('\n')
    html = []
    in_list = False
    in_table = False
    table_headers = []
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        
        if not line:
            if in_list:
                html.append('</ul>')
                in_list = False
            elif in_table:
                html.append('</tbody></table>')
                in_table = False
            html.append('')
            i += 1
            continue
        
        if line.startswith('#### '):
            if in_list:
                html.append('</ul>')
                in_list = False
            if in_table:
                html.append('</tbody></table>')
                in_table = False
            # For headings нам нужна только чистая строка без wikilinks
            raw_title = line[5:]
            title = strip_wikilinks_to_text(raw_title)
            title_id = title.lower().replace(' ', '-').replace('ё', 'е')
            title_id = re.sub(r'[^а-яa-z0-9-]', '', title_id)
            html.append(f'<h4 id="{title_id}">{title}</h4>')
        
        elif line.startswith('### '):
            if in_list:
                html.append('</ul>')
                in_list = False
            if in_table:
                html.append('</tbody></table>')
                in_table = False
            raw_title = line[4:]
            title = strip_wikilinks_to_text(raw_title)
            title_id = title.lower().replace(' ', '-').replace('ё', 'е')
            title_id = re.sub(r'[^а-яa-z0-9-]', '', title_id)
            html.append(f'<h3 id="{title_id}">{title}</h3>')
        
        elif line.startswith('## '):
            if in_list:
                html.append('</ul>')
                in_list = False
            if in_table:
                html.append('</tbody></table>')
                in_table = False
            raw_title = line[3:]
            title = strip_wikilinks_to_text(raw_title)
            title_id = title.lower().replace(' ', '-').replace('ё', 'е')
            title_id = re.sub(r'[^а-яa-z0-9-]', '', title_id)
            html.append(f'<h2 id="{title_id}">{title}</h2>')
        
        elif line.startswith('| ') and i + 1 < len(lines) and lines[i+1].startswith('| -'):
            if in_list:
                html.append('</ul>')
                in_list = False
            if in_table:
                html.append('</tbody></table>')
                in_table = False
            
            table_headers = [cell.strip() for cell in line.split('|')[1:-1]]
            html.append('<table>')
            html.append('<thead><tr>')
            for header in table_headers:
                header_clean = convert_wikilinks_in_text(header, base_prefix=base_prefix, allow_special_pages=allow_special_pages)
                header_clean = convert_wikilinks_in_text(header, base_prefix=base_prefix, allow_special_pages=allow_special_pages)
                header_clean = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', header_clean)
                html.append(f'<th>{header_clean}</th>')
            html.append('</tr></thead>')
            html.append('<tbody>')
            in_table = True
            i += 2
            continue
        
        elif in_table and line.startswith('| '):
            cells = [cell.strip() for cell in line.split('|')[1:-1]]
            html.append('<tr>')
            for cell in cells:
                cell_clean = convert_wikilinks_in_text(cell, base_prefix='../')
                cell_clean = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', cell_clean)
                cell_clean = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', cell_clean)
                cell_clean = cell_clean.replace('<br>', '<br>')
                html.append(f'<td>{cell_clean}</td>')
            html.append('</tr>')
        
        elif line.startswith('- '):
            if in_table:
                html.append('</tbody></table>')
                in_table = False
            if not in_list:
                html.append('<ul>')
                in_list = True
            item = convert_wikilinks_in_text(line[2:], base_prefix=base_prefix, allow_special_pages=allow_special_pages)
            item = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', item)
            item = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', item)
            html.append(f'<li>{item}</li>')
        
        elif line.startswith('---') or line.startswith('___'):
            if in_list:
                html.append('</ul>')
                in_list = False
            if in_table:
                html.append('</tbody></table>')
                in_table = False
        
        else:
            if in_list and not line.startswith('  '):
                html.append('</ul>')
                in_list = False
            if in_table and not line.startswith('| '):
                html.append('</tbody></table>')
                in_table = False
            
            if line and not line.startswith('Связи:'):
                text = convert_wikilinks_in_text(
                    line, base_prefix=base_prefix, allow_special_pages=allow_special_pages
                )
                text = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', text)
                text = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', text)
                html.append(f'<p>{text}</p>')
        
        i += 1
    
    if in_list:
        html.append('</ul>')
    if in_table:
        html.append('</tbody></table>')
    
    return '\n'.join(html)

def create_html_page(content_html, title, book_code, chapter_id, prev_link='', next_link=''):
    """Create full HTML page."""
    template = f'''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — E'Magios Core</title>
  <link rel="stylesheet" href="../styles.css">
</head>
<body data-book="{book_code}" data-chapter="{chapter_id}">
  <div class="page-with-sidebar">
    <!-- Sidebar will be injected here by common.js -->
    
    <div class="main-content">
      <main>
{content_html}

        <!-- Chapter Navigation -->
        <div class="chapter-navigation">'''
    
    if prev_link:
        template += f'\n          <a href="{prev_link[1]}" class="prev-chapter">← {prev_link[0]}</a>'
    if next_link:
        template += f'\n          <a href="{next_link[1]}" class="next-chapter">{next_link[0]} →</a>'
    
    template += '''
        </div>
      </main>
    </div> <!-- main-content -->
  </div> <!-- page-with-sidebar -->

  <!-- Scroll to top button -->
  <button id="scroll-to-top" class="scroll-to-top" aria-label="Наверх">↑</button>

  <script type="module" src="../common.js"></script>
</body>
</html>
'''
    return template

def main():
    if len(sys.argv) < 5:
        print("Usage: python convert_md_to_html.py <input_md> <output_html> <book_code> <chapter_id> [title]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    book_code = sys.argv[3]
    chapter_id = sys.argv[4]
    title = sys.argv[5] if len(sys.argv) > 5 else "Page"
    
    with open(input_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    html_content = convert_markdown_to_html(md_content, book_code)
    full_html = create_html_page(html_content, title, book_code, chapter_id)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_html)
    
    print(f"Converted {input_file} → {output_file}")

if __name__ == '__main__':
    main()

