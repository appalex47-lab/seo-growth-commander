from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def test_catalog_navigation_is_not_duplicated():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert html.count('data-view="catalog"') == 1

def test_xlsx_library_is_included_once():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert html.count('xlsx.full.min.js') == 1

def test_template_buttons_and_all_import_fields_are_present():
    js = (ROOT / 'frontend/js/catalog.js').read_text(encoding='utf-8')
    assert "catalog-template-xlsx" in js and "catalog-template-csv" in js
    fields = ['SKU','Nombre_Producto','URL_Slug','Marca','Sustancia_Activa','Categoria','Stock','Precio','Impresiones_GSC','Clicks_GSC','CTR_GSC','Posicion_GSC','Sesiones_Organicas','Conversion_Rate','AOV','Volumen_Mercado','Tendencia_Mercado','Tendencia_Marca','Tendencia_Sustancia','CPC','Gasto_Ads']
    field_list = re.search(r'const FIELDS=\[(.*?)\];', js, re.S).group(1)
    for field in fields:
        assert f"'{field}'" in field_list

def test_incremental_merge_is_by_sku_and_keeps_blank_values():
    js = (ROOT / 'frontend/js/catalog.js').read_text(encoding='utf-8')
    assert "loadCatalogBySource('real')" in js
    assert "indexBySku.get(sku)" in js
    assert "if(v!==null&&v!==undefined&&v!=='')next[k]=v" in js
    assert "created,updated,unchanged" in js

def test_phase_documentation_calls_out_known_limits():
    doc = (ROOT / 'docs/phases/fase-16.md').read_text(encoding='utf-8')
    assert 'No se afirma haber realizado pruebas E2E' in doc
    assert 'campo vacío no borra' in doc
