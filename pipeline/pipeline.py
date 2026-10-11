"""End-to-end deterministic pipeline for Growth SEO Command Center.

Flow: source rows -> normalization/merge -> validation/calculation -> AI context.
The AI layer is observational only; it cannot alter calculated business fields.
"""
from copy import deepcopy
from typing import Any, Dict, Iterable, List

from .integrations import normalize_row, merge_rows
from .business_rules import calculate_product

PIPELINE_VERSION = "1.0"

BASE_PRODUCT_FIELDS = (
    'SKU','URL_Slug','Nombre_Producto','Marca','Sustancia_Activa','Categoria',
    'Stock','Precio','Impresiones_GSC','Clicks_GSC','CTR_GSC','Posicion_GSC',
    'Sesiones_Organicas','Conversion_Rate','AOV','Volumen_Mercado',
    'Tendencia_Mercado','Tendencia_Marca','Tendencia_Sustancia','CPC','Gasto_Ads'
)

CALCULATED_FIELDS = (
    'Data_Quality','Potential_Traffic','Revenue_Gap','Organic_Search_Share',
    'Clasificacion','Prioridad'
)


def _quality_summary(products: List[Dict[str, Any]]) -> Dict[str, int]:
    summary = {'VALID': 0, 'INCOMPLETE': 0, 'INVALID': 0}
    for p in products:
        summary[p.get('Data_Quality', 'INVALID')] = summary.get(p.get('Data_Quality', 'INVALID'), 0) + 1
    return summary


def run_pipeline(source_rows: Iterable[Dict[str, Any]] = (), source: str | None = None,
                 base_products: Iterable[Dict[str, Any]] = (), expected_ctr: float = 0.10) -> Dict[str, Any]:
    """Run the complete local pipeline.

    `source_rows` are already-fetched external records. If `source` is given,
    they are normalized using the corresponding integration adapter. Base
    products may be used to enrich the canonical catalog before calculation.
    """
    rows = list(source_rows)
    normalized = [normalize_row(source, row) for row in rows] if source else rows
    merged = merge_rows(normalized)

    canonical: Dict[str, Dict[str, Any]] = {p['SKU']: deepcopy(p) for p in base_products if p.get('SKU')}
    for sku, row in merged.items():
        canonical.setdefault(sku, {'SKU': sku}).update(row)

    calculated = [calculate_product(p, expected_ctr) for p in canonical.values()]
    return {
        'pipeline_version': PIPELINE_VERSION,
        'source': source or 'canonical',
        'products': calculated,
        'quality_summary': _quality_summary(calculated),
        'product_count': len(calculated),
        'calculated_fields': list(CALCULATED_FIELDS),
        'ai_ready': True,
    }


def assert_ai_boundary(product: Dict[str, Any], ai_output: Dict[str, Any]) -> Dict[str, Any]:
    """Apply an AI response without allowing it to overwrite business truth."""
    protected = set(CALCULATED_FIELDS) | {'SKU'}
    result = dict(product)
    for key, value in ai_output.items():
        if key not in protected:
            result[key] = value
    return result
