"""Contratos y normalizadores locales para futuras fuentes de datos.

Fase 7 no realiza llamadas HTTP ni requiere credenciales. Los adaptadores
convierten payloads ya obtenidos por una integración en el contrato canónico
del Growth SEO Command Center. Así las APIs quedan desacopladas del motor.
"""
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List

@dataclass(frozen=True)
class IntegrationSpec:
    id: str
    name: str
    fields: tuple

SPECS = (
    IntegrationSpec('gsc','Google Search Console',('SKU','URL_Slug','Clicks_GSC','Impresiones_GSC','CTR_GSC','Posicion_GSC')),
    IntegrationSpec('ga4','Google Analytics 4',('SKU','Sesiones_Organicas','Conversion_Rate','AOV')),
    IntegrationSpec('merchant','Google Merchant Center',('SKU','Stock','Precio','Categoria','Marca')),
    IntegrationSpec('ads','Google Ads',('SKU','CPC','Gasto_Ads')),
    IntegrationSpec('trends','Google Trends / Market Data',('SKU','Volumen_Mercado','Tendencia_Mercado','Tendencia_Marca','Tendencia_Sustancia')),
)

CANONICAL_FIELDS = {f for spec in SPECS for f in spec.fields}

def _pick(row: Dict[str, Any], aliases: Iterable[str], default=None):
    for key in aliases:
        if key in row and row[key] is not None:
            return row[key]
    return default

def normalize_row(source: str, row: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize one already-fetched source row without calculating business metrics."""
    if source not in {s.id for s in SPECS}:
        raise ValueError(f'Fuente no soportada: {source}')
    aliases = {
        'SKU':['SKU','sku','item_id','product_id'],
        'URL_Slug':['URL_Slug','url','landingPage'],
        'Clicks_GSC':['Clicks_GSC','clicks','clicks_gsc'],
        'Impresiones_GSC':['Impresiones_GSC','impressions','impressions_gsc'],
        'CTR_GSC':['CTR_GSC','ctr'],
        'Posicion_GSC':['Posicion_GSC','position','position_gsc'],
        'Sesiones_Organicas':['Sesiones_Organicas','sessions','organic_sessions'],
        'Conversion_Rate':['Conversion_Rate','conversion_rate','conversionRate'],
        'AOV':['AOV','aov','average_order_value'],
        'Stock':['Stock','stock','quantity','inventory'],
        'Precio':['Precio','price'],
        'Categoria':['Categoria','category'],
        'Marca':['Marca','brand'],
        'CPC':['CPC','cpc'],
        'Gasto_Ads':['Gasto_Ads','spend','cost'],
        'Volumen_Mercado':['Volumen_Mercado','search_volume','volume'],
        'Tendencia_Mercado':['Tendencia_Mercado','market_trend','trend'],
        'Tendencia_Marca':['Tendencia_Marca','brand_trend'],
        'Tendencia_Sustancia':['Tendencia_Sustancia','ingredient_trend'],
    }
    return {field:_pick(row, aliases[field]) for field in CANONICAL_FIELDS if _pick(row, aliases[field]) is not None}

def merge_rows(rows: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Merge normalized rows by SKU; later source fields enrich earlier fields."""
    result: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        sku=row.get('SKU')
        if not sku:
            continue
        result.setdefault(sku, {'SKU':sku}).update(row)
    return result
