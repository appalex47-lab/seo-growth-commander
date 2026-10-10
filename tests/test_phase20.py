from pipeline.gsc_observations import synchronize_gsc_response

CATALOG = [
    {"SKU":"A1", "Nombre_Producto":"Producto A", "URL_Slug":"https://shop.example/p/a", "Volumen_Mercado":1000, "Conversion_Rate":0.02, "AOV":500},
    {"SKU":"B2", "Nombre_Producto":"Producto B", "URL_Slug":"https://shop.example/p/b", "Volumen_Mercado":800, "Conversion_Rate":0.01, "AOV":300},
]

def test_page_grain_runs_through_sync_and_preserves_provenance():
    result = synchronize_gsc_response(CATALOG, {"rows":[{"keys":["https://shop.example/p/a"],"clicks":10,"impressions":100,"ctr":0.1,"position":3.2}]}, ["page"], synced_at="2026-10-09T12:00:00Z")
    assert result["synchronized"] is True
    assert result["batch"]["accepted"] == 1
    product = next(p for p in result["batch"]["products"] if p["SKU"] == "A1")
    assert product["Clicks_GSC"] == 10 and product["Impresiones_GSC"] == 100
    assert product["_sync"]["gsc"]["status"] == "success"

def test_query_grain_stays_observations_only_and_catalog_is_not_mutated():
    before = [dict(p) for p in CATALOG]
    result = synchronize_gsc_response(CATALOG, {"rows":[{"keys":["https://shop.example/p/a","consulta"],"clicks":6,"impressions":60}]}, ["page","query"])
    assert result["synchronized"] is False and result["status"] == "observations_only"
    assert result["observations"][0]["dimensions"]["query"] == "consulta"
    assert CATALOG == before

def test_unmatched_url_is_reported_without_creating_product():
    result = synchronize_gsc_response(CATALOG, {"rows":[{"keys":["https://shop.example/missing"],"clicks":3}]}, ["page"])
    assert result["unmatched"][0]["reason"] == "unmatched_url"
    assert result["batch"]["product_count"] == 2
