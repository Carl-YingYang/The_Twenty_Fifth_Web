#!/usr/bin/env python3
"""Post-process the generated docx for WPS page-number compatibility:
1. Remove empty <w:pgNumType/> from cover section.
2. Patch TOC footer instrText: PAGE -> PAGE \\* ROMAN \\* MERGEFORMAT
3. Patch Body footer instrText: PAGE -> PAGE \\* arabic \\* MERGEFORMAT
"""
import zipfile
import shutil
import sys
from pathlib import Path

docx_path = Path(sys.argv[1])
tmp_path = docx_path.with_suffix(".tmp.docx")

shutil.copy(docx_path, tmp_path)

# Read all entries, patch the ones we care about
with zipfile.ZipFile(tmp_path, "r") as zin:
    entries = {name: zin.read(name) for name in zin.namelist()}

# --- Patch document.xml: remove empty <w:pgNumType/> ---
doc_xml = entries["word/document.xml"].decode("utf-8")
doc_xml = doc_xml.replace("<w:pgNumType/>", "")
entries["word/document.xml"] = doc_xml.encode("utf-8")
print("✓ Removed empty <w:pgNumType/> from document.xml")

# --- Patch footer1.xml (TOC section — Roman numerals) ---
if "word/footer1.xml" in entries:
    f1 = entries["word/footer1.xml"].decode("utf-8")
    f1 = f1.replace(
        "<w:instrText xml:space=\"preserve\">PAGE</w:instrText>",
        "<w:instrText xml:space=\"preserve\"> PAGE \\* ROMAN \\* MERGEFORMAT </w:instrText>",
    )
    entries["word/footer1.xml"] = f1.encode("utf-8")
    print("✓ Patched footer1.xml (TOC section -> PAGE \\* ROMAN \\* MERGEFORMAT)")

# --- Patch footer2.xml (Body section — Arabic) ---
if "word/footer2.xml" in entries:
    f2 = entries["word/footer2.xml"].decode("utf-8")
    f2 = f2.replace(
        "<w:instrText xml:space=\"preserve\">PAGE</w:instrText>",
        "<w:instrText xml:space=\"preserve\"> PAGE \\* arabic \\* MERGEFORMAT </w:instrText>",
    )
    entries["word/footer2.xml"] = f2.encode("utf-8")
    print("✓ Patched footer2.xml (Body section -> PAGE \\* arabic \\* MERGEFORMAT)")

# --- Write back ---
with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as zout:
    for name, data in entries.items():
        zout.writestr(name, data)

tmp_path.unlink()
print(f"✅ Post-processing complete: {docx_path}")
