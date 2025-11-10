# -*- coding: utf-8 -*-
"""
Parse School of Magic files from Obsidian Vault and generate schools.json
Usage: python parse_schools.py
"""
import os
import re
import json

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook"
OUTPUT_PATH = r"data\schools.json"

def clean_wikilink(text):
    """Remove wikilinks and return clean text."""
    # [[Link|Text]] -> Text
    text = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', text)
    # [[Link]] -> Link (extract just the display part)
    text = re.sub(r'\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]', lambda m: m.group(2) if m.group(2) else m.group(1).split('/')[-1], text)
    return text.strip()

def clean_markdown_formatting(text):
    """Remove markdown formatting like ** for bold."""
    # Remove bold
    text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
    # Remove italic
    text = re.sub(r'\*([^\*]+)\*', r'\1', text)
    return text.strip()

def parse_school_file(filepath):
    """Parse a school magic file and extract all data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract school name from filename
    filename = os.path.basename(filepath)
    name = filename.replace('Школа Магии - ', '').replace('.md', '')
    
    # Create slug ID
    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')
    
    school = {
        "id": slug,
        "name": name,
        "rarity": "",
        "properties": [],
        "description": "",
        "principles": [],
        "features": [],
        "educationalSpells": [],
        "relatedSchools": []
    }
    
    lines = content.split('\n')
    current_section = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Detect sections
        if line.startswith('#### Параметры'):
            current_section = 'parameters'
        elif line.startswith('#### Описание'):
            current_section = 'description'
        elif line.startswith('#### Принципы'):
            current_section = 'principles'
        elif line.startswith('#### Особенности'):
            current_section = 'features'
        elif line.startswith('#### Свойства'):
            # This could be properties/features section (not in parameters)
            current_section = 'properties_section'
        elif line.startswith('#### Учебные Заклинания'):
            current_section = 'spells'
        elif line.startswith('___'):
            # Check next line for "Связи:"
            current_section = 'links_section'
        elif line.startswith('####'):
            current_section = None
        
        # Parse parameters
        elif current_section == 'parameters' and line.startswith('-'):
            if '**Редкость**:' in line:
                rarity = clean_wikilink(line.split(':')[1])
                school['rarity'] = rarity
            elif '**Свойства**:' in line:
                props = clean_wikilink(line.split(':', 1)[1])
                if props:
                    school['properties'].append(props)
        
        # Parse description
        elif current_section == 'description' and line and not line.startswith('#'):
            if school['description']:
                school['description'] += ' ' + line
            else:
                school['description'] = line
        
        # Parse principles
        elif current_section == 'principles' and line.startswith('- '):
            principle = line[2:].strip()
            principle = clean_markdown_formatting(principle)
            school['principles'].append(principle)
        
        # Parse features
        elif current_section == 'features' and line.startswith('- '):
            feature = line[2:].strip()
            feature = clean_markdown_formatting(feature)
            school['features'].append(feature)
        
        # Parse properties section (special case for features)
        elif current_section == 'properties_section' and line.startswith('- '):
            # Check if this is a feature (starts with **Name**.) or just a property link
            if '**' in line and '.' in line:
                feature = line[2:].strip()
                feature = clean_markdown_formatting(feature)
                school['features'].append(feature)
            elif not line.startswith('- [['):
                # Plain text feature
                feature = line[2:].strip()
                feature = clean_markdown_formatting(feature)
                if feature:
                    school['features'].append(feature)
        
        # Parse educational spells
        elif current_section == 'spells' and line.startswith('- '):
            spell = clean_wikilink(line[2:])
            if spell:
                school['educationalSpells'].append(spell)
        
        # Parse related schools from "Связи:" section
        elif current_section == 'links_section' and line.startswith('Связи:'):
            # Extract all wikilinks from the line
            links_text = line.replace('Связи:', '').strip()
            # Find all [[...]] patterns
            wikilink_pattern = r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]'
            matches = re.findall(wikilink_pattern, links_text)
            for match in matches:
                # match[0] is the link, match[1] is the display text (if present)
                link_name = match[1] if match[1] else match[0].split('/')[-1]
                # Only add if it's a school (starts with "Школа Магии")
                if 'Школа Магии' in match[0] and link_name != name:
                    school['relatedSchools'].append(link_name)
    
    # Clean up description
    school['description'] = clean_markdown_formatting(school['description'])
    
    # Remove empty fields
    if not school['description']:
        del school['description']
    if not school['principles']:
        del school['principles']
    if not school['features']:
        del school['features']
    if not school['educationalSpells']:
        del school['educationalSpells']
    if not school['relatedSchools']:
        del school['relatedSchools']
    
    return school

def main():
    schools = []
    
    # Get all school files
    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Школа Магии') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing: {filename}")
            school = parse_school_file(filepath)
            schools.append(school)
    
    # Sort by name
    schools.sort(key=lambda x: x['name'])
    
    # Write to JSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully parsed {len(schools)} schools!")
    print(f"Output written to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()

