from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def test_catalog_import_uses_automatic_column_detection():
    js = (ROOT / 'frontend/js/catalog.js').read_text(encoding='utf-8')
    assert 'function detect(headers)' in js
    assert 'Revisión automática de columnas' in js
    assert 'no necesitas relacionarlos uno por uno' in js


def test_manual_mapping_is_optional_and_collapsed_by_default():
    js = (ROOT / 'frontend/js/catalog.js').read_text(encoding='utf-8')
    assert '<details class="catalog-mapping-details">' in js
    assert '<summary>Ajustar asignaciones (opcional)</summary>' in js


def test_ambiguous_header_aliases_are_not_auto_assigned():
    js = (ROOT / 'frontend/js/catalog.js').read_text(encoding='utf-8')
    assert 'function getMappingConflicts(headers)' in js
    assert 'if(keys.length===1)map[keys[0]]=header' in js
    assert 'encabezados ambiguos que requieren revisión' in js


def test_required_fields_are_reported_when_not_detected():
    js = (ROOT / 'frontend/js/catalog.js').read_text(encoding='utf-8')
    assert 'const requiredMissing=REQUIRED.filter(k=>!detected[k])' in js
    assert 'Faltan columnas obligatorias' in js
