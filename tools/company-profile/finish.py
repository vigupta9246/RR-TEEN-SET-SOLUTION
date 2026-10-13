"""Adds document metadata and makes the PDF fast-web-view (linearized).
   python3 finish.py [in.pdf] [out.pdf]     needs: pip install pypdf ; qpdf on PATH"""
import subprocess, sys, os
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject, DictionaryObject, BooleanObject

here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'build', 'profile-raw.pdf')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, '..', '..', 'rr-teen-set-solution-company-profile.pdf')
tmp = os.path.join(here, 'build', 'profile-meta.pdf')

r = PdfReader(src)
w = PdfWriter(clone_from=r)
w.add_metadata({
    '/Title': 'R.R Teen Set Solution - Company Profile',
    '/Author': 'R.R Teen Set Solution',
    '/Subject': 'Tin shed, industrial shed, PEB structure and roofing contractor, Najafgarh, Delhi NCR',
    '/Keywords': 'tin shed, PEB, industrial shed, prefab warehouse, roofing, Delhi NCR, company profile',
    '/Creator': 'R.R Teen Set Solution',
})
# Show the document title (not the file name) in the viewer's title bar; declare the language.
root = w._root_object
vp = DictionaryObject({NameObject('/DisplayDocTitle'): BooleanObject(True)})
root[NameObject('/ViewerPreferences')] = vp
root[NameObject('/Lang')] = TextStringObject('en-IN')
os.makedirs(os.path.dirname(tmp), exist_ok=True)
with open(tmp, 'wb') as f:
    w.write(f)
subprocess.run(['qpdf', '--linearize', '--object-streams=generate', tmp, dst], check=True)
print('wrote', os.path.abspath(dst), os.path.getsize(dst) // 1024, 'KB', len(r.pages), 'pages')
