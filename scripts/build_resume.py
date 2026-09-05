"""Rebuild public/resume.pdf from the portfolio's maintained résumé source.
Requires reportlab. Content was carried forward from the existing public PDF;
the Cencora role and August 2026 start were checked on LinkedIn on 2026-09-05.
"""
from pathlib import Path
from html import escape
import json
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'scripts/resume-content.json').read_text())
ink = colors.HexColor('#222431')
accent = colors.HexColor('#4845aa')
styles = {
    'name': ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=22, leading=25, textColor=ink, spaceAfter=4),
    'role': ParagraphStyle('role', fontName='Helvetica', fontSize=11, leading=14, textColor=accent, spaceAfter=7),
    'contact': ParagraphStyle('contact', fontName='Helvetica', fontSize=8, leading=11, textColor=ink, spaceAfter=8),
    'section': ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=accent, spaceBefore=10, spaceAfter=7),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=ink, spaceBefore=5, spaceAfter=3),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=8.7, leading=11.5, textColor=ink, spaceAfter=4),
    'note': ParagraphStyle('note', fontName='Helvetica-Oblique', fontSize=8.3, leading=11, textColor=ink, spaceAfter=4),
    'bullet': ParagraphStyle('bullet', fontName='Helvetica', fontSize=8.5, leading=11, textColor=ink, leftIndent=9, firstLineIndent=-7, spaceAfter=3),
}
def p(value, kind='body'):
    return Paragraph(escape(value), styles[kind])
def section(value):
    return p(value.upper(), 'section')

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#d7d7e2'))
    canvas.line(40, 32, 572, 32)
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(colors.HexColor('#626575'))
    canvas.drawString(40, 20, 'Jan Faris | jankfaris.com')
    canvas.drawRightString(572, 20, str(doc.page))

story=[p(data['name'],'name'),p(data['role'],'role'),p(data['contact'],'contact'),section('Summary'),p(data['summary']),section('Professional experience')]
for item in data['experience']:
    block=[p(item['heading']+' | '+item['period'],'heading')]
    if item['note']: block.append(p(item['note'],'note'))
    block.extend(p('• '+bullet,'bullet') for bullet in item['bullets'])
    story.append(KeepTogether(block))
story.append(p(data['earlier'],'note'))
story.extend([PageBreak(),section('AI product portfolio - independent work'),p('8 products shipped in 18 months. Live demos and writeups at jankfaris.com.')])
for item in data['projects']:
    story.append(KeepTogether([p(item['heading'],'heading'),p(item['body'])]))
story.append(section('Skills'))
story.extend(p(skill) for skill in data['skills'])
story.append(section('What managers say - LinkedIn'))
story.extend(p(quote,'note') for quote in data['quotes'])
story.extend([section('Education & certifications'),p(data['education'])])
SimpleDocTemplate(str(ROOT/'public/resume.pdf'),pagesize=(612,792),rightMargin=40,leftMargin=40,topMargin=35,bottomMargin=44,title='Jan Faris - Lead AI Engineer',author='Jan Faris').build(story,onFirstPage=footer,onLaterPages=footer)
