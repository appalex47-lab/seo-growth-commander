from pathlib import Path
import sys
ROOT=Path(__file__).parents[1]; sys.path.insert(0,str(ROOT))
from pipeline.gsc_observations import normalize_gsc_response, map_page_observations_to_catalog

CATALOG=[{"SKU":"A1","URL_Slug":"https://shop.example/p/a"},
         {"SKU":"B2","URL_Slug":"https://shop.example/p/b"}]

def test_page_only_grain_can_map_to_product_url():
    data=normalize_gsc_response({"rows":[{"keys":["https://shop.example/p/a"],"clicks":10,"impressions":100,"ctr":0.1,"position":3.2}]},["page"])
    mapped=map_page_observations_to_catalog(data,CATALOG)
    assert mapped["mapped"][0]["SKU"]=="A1"
    assert mapped["mapped"][0]["clicks"]==10 and not mapped["blocked"]

def test_query_page_grain_is_preserved_and_never_mapped_as_product_total():
    data=normalize_gsc_response({"rows":[{"keys":["https://shop.example/p/a","consulta uno"],"clicks":6,"impressions":60},{"keys":["https://shop.example/p/a","consulta dos"],"clicks":4,"impressions":40}]},["page","query"])
    mapped=map_page_observations_to_catalog(data,CATALOG)
    assert data["row_count"]==2 and data["observations"][0]["dimensions"]["query"]=="consulta uno"
    assert data["grain"]=="page+query" and mapped["blocked"]
    assert mapped["reason"]=="product_mapping_requires_page_only_grain"

def test_date_device_country_grain_is_not_collapsed():
    data=normalize_gsc_response({"rows":[{"keys":["2026-10-01","MOBILE","MEX"],"clicks":2}]},["date","device","country"])
    assert data["grain"]=="date+device+country"
    assert data["observations"][0]["dimensions"]=={"date":"2026-10-01","device":"MOBILE","country":"MEX"}
    assert not data["product_mapping_allowed"]

def test_duplicate_or_invalid_dimensions_rejected():
    for dims in (["page","page"], ["sku"], []):
        try: normalize_gsc_response({"rows":[]},dims)
        except ValueError as exc: assert "invalid_gsc_dimensions" in str(exc)
        else: assert False, f"Debió rechazar dimensiones: {dims}"

def test_malformed_keys_rejected_and_unmatched_urls_reported():
    try: normalize_gsc_response({"rows":[{"keys":["only-one"],"clicks":1}]},["page","query"])
    except ValueError as exc: assert "invalid_gsc_row_keys" in str(exc)
    else: assert False, "Debió rechazar keys incompletas"
    data=normalize_gsc_response({"rows":[{"keys":["https://shop.example/missing"],"clicks":1}]},["page"])
    result=map_page_observations_to_catalog(data,CATALOG)
    assert result["unmatched"]==[{"page":"https://shop.example/missing","reason":"unmatched_url"}]
