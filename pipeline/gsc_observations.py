"""Fase 19: preservar la granularidad nativa de Search Console.

Las filas GSC son observaciones por combinación de dimensiones; no deben
convertirse automáticamente en métricas por producto si incluyen query, date,
device, country o searchAppearance.
"""
from __future__ import annotations
from typing import Any, Dict, Iterable, List

ALLOWED_DIMENSIONS = {"page", "query", "country", "device", "searchAppearance", "date"}
METRIC_KEYS = ("clicks", "impressions", "ctr", "position")


def normalize_gsc_response(response: Dict[str, Any], dimensions: Iterable[str]) -> Dict[str, Any]:
    dims = list(dimensions)
    if not dims or len(set(dims)) != len(dims) or any(d not in ALLOWED_DIMENSIONS for d in dims):
        raise ValueError("invalid_gsc_dimensions")
    raw_rows = response.get("rows", [])
    if not isinstance(raw_rows, list):
        raise ValueError("invalid_gsc_rows")
    observations: List[Dict[str, Any]] = []
    for idx, row in enumerate(raw_rows):
        if not isinstance(row, dict):
            continue
        keys = row.get("keys", [])
        if not isinstance(keys, list) or len(keys) != len(dims):
            raise ValueError(f"invalid_gsc_row_keys:{idx}")
        item = {"dimensions": dict(zip(dims, keys)), "grain": "+".join(dims)}
        for metric in METRIC_KEYS:
            value = row.get(metric)
            if value is not None:
                item[metric] = value
        observations.append(item)
    page_only = dims == ["page"]
    return {
        "source": "gsc",
        "dimensions": dims,
        "grain": "+".join(dims),
        "row_count": len(observations),
        "observations": observations,
        # Only pure page-grain data can be safely mapped to product URL metrics.
        "product_mapping_allowed": page_only,
        "mapping_reason": "page_only_grain" if page_only else "preserve_observation_grain",
    }


def map_page_observations_to_catalog(normalized: Dict[str, Any], catalog: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    """Map page-only rows to catalog URLs; never assign query-level rows to SKUs."""
    if not normalized.get("product_mapping_allowed") or normalized.get("dimensions") != ["page"]:
        return {"mapped": [], "unmatched": [], "blocked": True,
                "reason": "product_mapping_requires_page_only_grain"}
    by_url: Dict[str, List[Dict[str, Any]]] = {}
    for product in catalog:
        url = str(product.get("URL_Slug") or "").strip().rstrip("/")
        if url:
            by_url.setdefault(url, []).append(product)
    mapped, unmatched = [], []
    for obs in normalized.get("observations", []):
        url = str(obs.get("dimensions", {}).get("page") or "").strip().rstrip("/")
        matches = by_url.get(url, [])
        if len(matches) == 1:
            mapped.append({"SKU": matches[0].get("SKU"), "URL_Slug": url,
                           **{k: obs[k] for k in METRIC_KEYS if k in obs}})
        else:
            unmatched.append({"page": url, "reason": "unmatched_url" if not matches else "ambiguous_url"})
    return {"mapped": mapped, "unmatched": unmatched, "blocked": False,
            "reason": "page_only_grain"}


def synchronize_gsc_response(catalog, response, dimensions, synced_at=None, expected_ctr=0.10):
    """Connect a raw GSC response to phase-18 synchronization safely.

    Non-page-only grains are returned intact and never written to product metrics.
    Page-only rows are mapped by exact catalog URL, then sent through the normal
    deterministic batch synchronizer so provenance, coverage and recalculation apply.
    """
    from .synchronization import synchronize_batch
    normalized = normalize_gsc_response(response, dimensions)
    mapping = map_page_observations_to_catalog(normalized, catalog)
    result = {
        "source": "gsc", "grain": normalized["grain"],
        "dimensions": normalized["dimensions"],
        "observations": normalized["observations"],
        "row_count": normalized["row_count"],
        "mapping": mapping, "synchronized": False,
    }
    if mapping["blocked"]:
        result["status"] = "observations_only"
        result["reason"] = mapping["reason"]
        return result
    rows = []
    for item in mapping["mapped"]:
        row = {"SKU": item.get("SKU"), "URL_Slug": item.get("URL_Slug")}
        for source_field, target_field in (("clicks", "Clicks_GSC"), ("impressions", "Impresiones_GSC"),
                                           ("ctr", "CTR_GSC"), ("position", "Posicion_GSC")):
            if source_field in item:
                row[target_field] = item[source_field]
        rows.append(row)
    batch = synchronize_batch(catalog, "gsc", rows, synced_at=synced_at, expected_ctr=expected_ctr)
    result.update({"status": batch["status"], "synchronized": True, "batch": batch,
                   "unmatched": mapping["unmatched"]})
    return result
