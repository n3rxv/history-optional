import subprocess, os, re

BASE = "/Users/nirxv_03/Desktop/LevelUp IAS History Optional Handouts"
MODERN = f"{BASE}/Modern History Optional Handouts"
ANCIENT = f"{BASE}/Ancient History Optional Handouts"
MEDIEVAL = f"{BASE}/Medieval History Optional Handouts"
WORLD = f"{BASE}/World History Optional Handouts"
POSTIND = f"{BASE}/Post-Independence India History Optional Handouts"

slug_pdfs = {
    # ANCIENT INDIA
    'sources-ancient-india': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_02_-_Sources.pdf",
    ],
    'prehistory-protohistory': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_03_-_Stone_Ages.pdf",
        f"{ANCIENT}/History_Foundation_2025_-_Handout_05_-_Chalcolithic_Age.pdf",
    ],
    'indus-valley-civilization': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_04_-_Harappan_Civilisation.pdf",
    ],
    'megalithic-cultures': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_06_-_Megalithic_Age.pdf",
    ],
    'aryans-vedic-period': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_07_-_Vedic_Age.pdf",
    ],
    'mahajanapadas': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_08_-_Mahajanapada.pdf",
    ],
    'mauryan-empire': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_09_-_Mauryans.pdf",
    ],
    'post-mauryan-period': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_10_-_Post_Mauryan.pdf",
    ],
    'guptas-vakatakas-vardhanas': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_11_-_Guptas.pdf",
    ],
    'regional-states-gupta-era': [
        f"{ANCIENT}/History_Foundation_2025_Handout_12_Pallavas_and_Chalukyas.pdf",
    ],
    'early-indian-cultural-history': [
        f"{ANCIENT}/History_Foundation_2025_-_Handout_13_-_Harshavardhan.pdf",
        f"{ANCIENT}/History_Foundation_2025_-_Handout_11_-_Guptas.pdf",
    ],
    'eastern-india-deccan-south': [
        f"{ANCIENT}/History_Foundation_2025_Handout_12_Pallavas_and_Chalukyas.pdf",
        f"{ANCIENT}/History_Foundation_2025_-_Handout_13_-_Harshavardhan.pdf",
    ],

    # MEDIEVAL INDIA
    'early-medieval-india': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_1_-_Early_Medieval_Age.pdf",
    ],
    'cultural-traditions-750-1200': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_1_-_Early_Medieval_Age.pdf",
        f"{MEDIEVAL}/History_Foundation_1_0_Handout_3_Bhakti_Sufi_plus_Vijayanagar_Bahamani.pdf",
    ],
    'thirteenth-century': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_2_-_Delhi_Sultanate.pdf",
    ],
    'fourteenth-century': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_2_-_Delhi_Sultanate.pdf",
    ],
    'society-culture-economy-13-14c': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_2_-_Delhi_Sultanate.pdf",
        f"{MEDIEVAL}/History_Foundation_1_0_Handout_3_Bhakti_Sufi_plus_Vijayanagar_Bahamani.pdf",
    ],
    'fifteenth-sixteenth-century-political': [
        f"{MEDIEVAL}/History_Foundation_1_0_Handout_3_Bhakti_Sufi_plus_Vijayanagar_Bahamani.pdf",
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_4_-_Mughals.pdf",
    ],
    'fifteenth-sixteenth-century-society': [
        f"{MEDIEVAL}/History_Foundation_1_0_Handout_3_Bhakti_Sufi_plus_Vijayanagar_Bahamani.pdf",
    ],
    'akbar': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_4_-_Mughals.pdf",
    ],
    'mughal-empire-17th-century': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_4_-_Mughals.pdf",
    ],
    'economy-society-16-17c': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_4_-_Mughals.pdf",
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_5_-_Marathas.pdf",
    ],
    'mughal-culture': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_4_-_Mughals.pdf",
    ],
    'eighteenth-century': [
        f"{MEDIEVAL}/History_Foundation_1.0_-_Handout_5_-_Marathas.pdf",
        f"{MODERN}/Handout_4_18th_century.pdf",
    ],

    # MODERN INDIA
    'european-penetration-india': [
        f"{MODERN}/Handout_3_Early_Modern_Globalization.pdf",
        f"{MODERN}/Handout_5_Carnatic_Wars.pdf",
        f"{MODERN}/Handout_9_Mercantile_Phase_1.pdf",
    ],
    'british-expansion-india': [
        f"{MODERN}/Handout_6_Conquest_of_Bengal.pdf",
        f"{MODERN}/Handout_7_Conquest_of_Mysore.pdf",
        f"{MODERN}/Handout_8_Anglo-Maratha_Wars.pdf",
        f"{MODERN}/Handout_12_Afghanistan_Sindh_Punjab.pdf",
        f"{MODERN}/Handout_13_Stages_of_British_Conquest_Dalhousie.pdf",
    ],
    'early-british-raj': [
        f"{MODERN}/Handout_14_Industrial_Phase_1_-_Charter_Acts.pdf",
        f"{MODERN}/Handout_15_Industrial_Phase_2_Administrative_and_Revenue_Policies.pdf",
    ],
    'economic-impact-british-rule': [
        f"{MODERN}/Handout_10_Mercantile_Phase_2.pdf",
        f"{MODERN}/Handout_11_Mercantile_Phase_3.pdf",
        f"{MODERN}/Handout_16_Industrial_Phase_3_-_Economic_Aspects.pdf",
        f"{MODERN}/Handout_18_Financial_Phase.pdf",
    ],
    'social-cultural-developments': [
        f"{MODERN}/Handout_17_Industrial_Phase_4_-_Sociocultural_Aspects.pdf",
    ],
    'social-religious-reform': [
        f"{MODERN}/Handout_21_Socio-religious_Reform_movement.pdf",
    ],
    'indian-response-british-rule': [
        f"{MODERN}/Handout_19_Uprisings.pdf",
        f"{MODERN}/Handout_20_Great_Revolt.pdf",
    ],
    'birth-indian-nationalism': [
        f"{MODERN}/Handout_22_Early_Indian_Nationalism.pdf",
        f"{MODERN}/Handout_23_Swadeshi_Movementplus_1909_Act.pdf",
        f"{MODERN}/Handout_24_First_phase_of_Revolutionary_Extremism.pdf",
    ],
    'gandhian-nationalism': [
        f"{MODERN}/Handout_25_Nationalism_during_First_World_War.pdf",
        f"{MODERN}/Handout_26_Early_Phase_of_Gandhi.pdf",
        f"{MODERN}/27_Rise_of_Post-war_discontent_and_response.pdf",
    ],
    'constitutional-developments': [
        f"{MODERN}/Handout_14_Industrial_Phase_1_-_Charter_Acts.pdf",
        f"{MODERN}/28_Simon_Commission_CDM_RTC_Gandhi-Irwin_Pact_Communal_award.pdf",
        f"{MODERN}/29_Act_of_1935plusPost_CDM_debateplus_28_months_INC_rule.pdf",
    ],
    'other-strands-national-movement': [
        f"{MODERN}/Handout_24_First_phase_of_Revolutionary_Extremism.pdf",
        f"{MODERN}/Handout_25_Nationalism_during_First_World_War.pdf",
    ],
    'politics-separatism-partition': [
        f"{MODERN}/28_Simon_Commission_CDM_RTC_Gandhi-Irwin_Pact_Communal_award.pdf",
        f"{MODERN}/29_Act_of_1935plusPost_CDM_debateplus_28_months_INC_rule.pdf",
        f"{MODERN}/30_Towards_Independence.pdf",
    ],
    'post-independence-consolidation': [
        f"{POSTIND}/1_Integration_of_States.pdf",
        f"{POSTIND}/2_National_language_issue.pdf",
        f"{POSTIND}/3_Refugee_crisis_First_elections.pdf",
        f"{POSTIND}/5_EnvironmentalismJ_Foreign_policy_and_Communalism.pdf",
    ],
    'caste-ethnicity-post-1947': [
        f"{POSTIND}/4_Tribal_integrationplusland_reforms.pdf",
        f"{POSTIND}/5_EnvironmentalismJ_Foreign_policy_and_Communalism.pdf",
    ],
    'economic-development-political-change': [
        f"{POSTIND}/4_Tribal_integrationplusland_reforms.pdf",
        f"{POSTIND}/3_Refugee_crisis_First_elections.pdf",
    ],

    # WORLD HISTORY
    'enlightenment-modern-ideas': [
        f"{WORLD}/Handout_3_Enlightenment_Part_1.pdf",
        f"{WORLD}/Handout_4_Enlightenment_Part_2.pdf",
        f"{WORLD}/Handout_5_What_is_Enlightenment_-_Kant.pdf",
        f"{WORLD}/Handout_6_Enlightenment_Part_3_Rousseau_Kant.pdf",
    ],
    'origins-modern-politics': [
        f"{WORLD}/Handout_7_American_Revolution.pdf",
        f"{WORLD}/Handout_8_American_Constitution.pdf",
        f"{WORLD}/Handout_9_American_Civil_War.pdf",
        f"{WORLD}/Handout_10_FR_-_Causes.pdf",
        f"{WORLD}/Handout_11_FR_-_Phase_1.pdf",
        f"{WORLD}/Handout_12_FR_-_Phase_2_3.pdf",
        f"{WORLD}/Handout_13_FR_-_Phase_4_Napoleon.pdf",
        f"{WORLD}/Handout_14_Legacy_of_French_Revolution.pdf",
        f"{WORLD}/Handout_15_CoV_Ideologies_Nationalism.pdf",
        f"{WORLD}/Handout_16_Post_Napoleonic_Europe_2_1820-1830.pdf",
        f"{WORLD}/Handout_17_Post_Napoleonic_Europe_3_1848.pdf",
        f"{WORLD}/Handout_18_Italian_Unification_Risorgimento.pdf",
        f"{WORLD}/Handout_19_German_Unification_Deutsche_Einigung.pdf",
    ],
    'industrialization': [
        f"{WORLD}/Handout_1_Early_Modern_Part_1.pdf",
        f"{WORLD}/Handout_2_Early_Modern_Part_2.pdf",
        f"{WORLD}/Handout_20_IR_in_Britain.pdf",
        f"{WORLD}/Handout_21_British_Democratic_Politics.pdf",
        f"{WORLD}/Handout_22_Spread_of_IR.pdf",
        f"{WORLD}/Handout_23_Socialism_and_Marxism_Part_1.pdf",
        f"{WORLD}/Handout_24_Socialism_and_Marxism_Part_2.pdf",
    ],
    'nation-state-system': [
        f"{WORLD}/Handout_15_CoV_Ideologies_Nationalism.pdf",
        f"{WORLD}/Handout_18_Italian_Unification_Risorgimento.pdf",
        f"{WORLD}/Handout_19_German_Unification_Deutsche_Einigung.pdf",
        f"{WORLD}/Handout_27_Bismarck_Foreign_Policy.pdf",
        f"{WORLD}/Handout_28_Eastern_Question.pdf",
    ],
    'imperialism-colonialism': [
        f"{WORLD}/Handout_25_Imperialism_Colonialism.pdf",
        f"{WORLD}/Handout_26_Neo_Imperialism_-_Phase_2.pdf",
        f"{WORLD}/Handout_35_Arab_Nationalism.pdf",
        f"{WORLD}/Handout_37_Imperial_Japan.pdf",
    ],
    'revolution-counter-revolution': [
        f"{WORLD}/Handout_32_Russian_Revolution.pdf",
        f"{WORLD}/Handout_33_Great_Depression.pdf",
        f"{WORLD}/Handout_34_Fascism_Mussolini_Hitler.pdf",
        f"{WORLD}/Handout_36_Locarno_League_of_Nations.pdf",
        f"{WORLD}/Handout_38_Foreign_Policy_of_Mussolini_and_Hitler.pdf",
    ],
    'world-wars': [
        f"{WORLD}/Handout_29_World_War_1_-_Causes.pdf",
        f"{WORLD}/Handout_30_World_War_1_-_Consequences.pdf",
        f"{WORLD}/Handout_31_Paris_Peace_Treaties.pdf",
        f"{WORLD}/Handout_39_WW2_Consequences.pdf",
    ],
    'world-after-wwii': [
        f"{WORLD}/Handout_40_Cold_War_Part_1.pdf",
        f"{WORLD}/Handout_41_Cold_War_2.pdf",
        f"{WORLD}/Handout_42_Cold_War_3.pdf",
        f"{WORLD}/Handout_45_UNO.pdf",
    ],
    'liberation-colonial-rule': [
        f"{WORLD}/Handout_44_Chinese_Revolution.pdf",
        f"{WORLD}/Handout_47_Decolonization_and_Underdevelopment.pdf",
        f"{WORLD}/Handout_48_Third_World_NAM.pdf",
        f"{WORLD}/Handout_49_Apartheid.pdf",
    ],
    'decolonization-underdevelopment': [
        f"{WORLD}/Handout_47_Decolonization_and_Underdevelopment.pdf",
        f"{WORLD}/Handout_48_Third_World_NAM.pdf",
    ],
    'unification-europe': [
        f"{WORLD}/Handout_46_Integration_of_Europe.pdf",
    ],
    'disintegration-soviet-union': [
        f"{WORLD}/Handout_43_USSR_Disintegration_Eastern_Europe.pdf",
        f"{WORLD}/Handout_50_Unipolar_World_Order.pdf",
    ],
}

def extract_pdf(path):
    if not os.path.exists(path):
        print(f"  MISSING: {os.path.basename(path)}")
        return ""
    result = subprocess.run(['pdftotext', '-raw', path, '-'],
        capture_output=True, text=True, errors='replace')
    t = result.stdout
    t = t.replace('\ufb01','fi').replace('\ufb02','fl')
    t = t.replace('\ufb03','ffi').replace('\ufb04','ffl')
    t = t.replace('\u2019',"'").replace('\u2018',"'")
    t = t.replace('\u201c','"').replace('\u201d','"')
    t = t.replace('\u2013','-').replace('\u2014','--')
    return t

def clean(text):
    text = re.sub(r'Ph:\s*[\d\s,|]+', '', text)
    text = re.sub(r'0804524849[12]|7041021151', '', text)
    text = re.sub(r'students@\S+', '', text)
    text = re.sub(r'[Ll]evel[Uu]p\s*IAS[^\n]*', '', text)
    text = re.sub(r'Niruv\s*Bhardwaj[^\n]*', '', text)
    text = re.sub(r'\+91[-\s]*\d*', '', text)
    text = re.sub(r'Handout\s*\d+[^\n<]*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Lecture\s*\d+[^\n<]*', '', text, flags=re.IGNORECASE)
    return text

def text_to_html(text):
    text = clean(text)
    lines = text.split('\n')
    html_parts = []
    ol_open = ul_open = False
    for line in lines:
        line = line.strip()
        if not line:
            if ol_open: html_parts.append('</ol>'); ol_open = False
            if ul_open: html_parts.append('</ul>'); ul_open = False
            continue
        if len(line) < 80 and line.isupper() and len(line) > 3:
            if ol_open: html_parts.append('</ol>'); ol_open = False
            if ul_open: html_parts.append('</ul>'); ul_open = False
            html_parts.append(f'<h2>{line.title()}</h2>')
        elif re.match(r'^[•\-\*]\s+\S', line):
            if ol_open: html_parts.append('</ol>'); ol_open = False
            if not ul_open: html_parts.append('<ul>'); ul_open = True
            html_parts.append(f'<li>{re.sub(r"^[•*-]\s+","",line)}</li>')
        elif re.match(r'^\d+\.\s+\S', line):
            if ul_open: html_parts.append('</ul>'); ul_open = False
            if not ol_open: html_parts.append('<ol>'); ol_open = True
            html_parts.append(f'<li>{line[line.index(".")+2:]}</li>')
        elif re.match(r'^[a-f]\.\s+\S', line):
            if not ul_open: html_parts.append('<ul>'); ul_open = True
            html_parts.append(f'<li>{line[line.index(".")+2:]}</li>')
        else:
            if ol_open: html_parts.append('</ol>'); ol_open = False
            if ul_open: html_parts.append('</ul>'); ul_open = False
            html_parts.append(f'<p>{line}</p>')
    if ol_open: html_parts.append('</ol>')
    if ul_open: html_parts.append('</ul>')
    return '\n'.join(html_parts)

note_content = {}
for slug, paths in slug_pdfs.items():
    print(f"Processing: {slug}")
    combined = ''
    for path in paths:
        combined += extract_pdf(path) + '\n'
    if combined.strip():
        note_content[slug] = text_to_html(combined)
    else:
        note_content[slug] = '<p>Content coming soon.</p>'

print("Writing noteContent.ts...")
out = ['export const noteContent: Record<string, string> = {']
for slug, html in note_content.items():
    escaped = html.replace('\\','\\\\').replace('`','\\`').replace('${','\\${')
    out.append(f"  '{slug}': `{escaped}`,")
out.append('}')
out.append('')
out.append('export function getNoteContent(slug: string): string {')
out.append('  return noteContent[slug] || `<h1>Notes Coming Soon</h1><p>This topic is being prepared.</p>`;')
out.append('}')

with open('lib/noteContent.ts', 'w') as f:
    f.write('\n'.join(out))

size = os.path.getsize('lib/noteContent.ts')
missing = sum(1 for v in note_content.values() if 'coming soon' in v)
print(f"Done! {size/1024/1024:.1f}MB | {len(note_content)} slugs | {missing} empty")
