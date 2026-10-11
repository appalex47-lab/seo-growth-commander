from pathlib import Path
import sys
ROOT=Path(__file__).parents[1]; sys.path.insert(0,str(ROOT))
from pipeline.synchronization import synchronize_batch

CATALOG=[{'SKU':'A1','Nombre_Producto':'Producto A','URL_Slug':'/producto-a','Stock':12,'Clicks_GSC':4,'Impresiones_GSC':100,'Posicion_GSC':8,'Conversion_Rate':0.02,'AOV':300,'Volumen_Mercado':1000},
         {'SKU':'B2','Nombre_Producto':'Producto B','URL_Slug':'/producto-b','Stock':20,'Clicks_GSC':8,'Impresiones_GSC':200,'Posicion_GSC':5,'Conversion_Rate':0.03,'AOV':250,'Volumen_Mercado':2000}]

def test_sync_updates_matching_sku_and_recalculates_metrics():
    result=synchronize_batch(CATALOG,'gsc',[{'SKU':'A1','clicks':25,'impressions':500,'position':4}], '2026-10-09T12:00:00Z')
    a=next(p for p in result['products'] if p['SKU']=='A1')
    assert a['Clicks_GSC']==25 and a['Impresiones_GSC']==500 and a['Posicion_GSC']==4
    assert a['Revenue_Gap'] is not None and a['_sync']['gsc']['synced_at']=='2026-10-09T12:00:00Z'
    assert result['updated']==1 and result['rejected']==0

def test_missing_fields_do_not_erase_previous_values():
    result=synchronize_batch(CATALOG,'gsc',[{'SKU':'A1','clicks':25}], '2026-10-09T12:00:00Z')
    a=next(p for p in result['products'] if p['SKU']=='A1')
    assert a['Clicks_GSC']==25 and a['Impresiones_GSC']==100 and a['Posicion_GSC']==8

def test_duplicate_and_unknown_skus_are_reported_not_silently_applied():
    result=synchronize_batch(CATALOG,'gsc',[{'SKU':'A1','clicks':25},{'SKU':'A1','clicks':26},{'SKU':'Z9','clicks':9}])
    assert result['accepted']==1 and result['rejected']==2
    assert {e['reason'] for e in result['errors']}=={'duplicate_sku_in_batch','sku_not_in_catalog'}

def test_url_only_row_maps_only_to_unique_catalog_url():
    result=synchronize_batch(CATALOG,'gsc',[{'landingPage':'/producto-a','clicks':31}])
    a=next(p for p in result['products'] if p['SKU']=='A1')
    assert a['Clicks_GSC']==31 and result['accepted']==1

def test_catalog_product_not_in_batch_is_preserved_and_freshness_shows_coverage():
    result=synchronize_batch(CATALOG,'gsc',[{'SKU':'A1','clicks':25}])
    b=next(p for p in result['products'] if p['SKU']=='B2')
    assert b['Clicks_GSC']==8
    assert result['source_freshness']['gsc']['coverage']==0.5

def test_unsupported_source_fails_explicitly():
    try: synchronize_batch(CATALOG,'unknown',[])
    except ValueError as exc: assert 'no soportada' in str(exc)
    else: assert False, 'Debió rechazar fuente desconocida'
