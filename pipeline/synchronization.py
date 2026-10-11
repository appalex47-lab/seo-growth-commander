"""Fase 18: normalización, trazabilidad y consolidación de lotes sincronizados.

No realiza llamadas de red ni persiste credenciales. Consume filas que un adaptador
ya obtuvo, conserva datos previos cuando una fuente no entrega un campo y vuelve a
calcular las métricas mediante el motor determinista existente.
"""
from __future__ import annotations
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
from typing import Any, Dict, Iterable, List, Optional

from .integrations import normalize_row
from .business_rules import calculate_product

SOURCE_FIELDS = {
    'gsc': {'URL_Slug','Clicks_GSC','Impresiones_GSC','CTR_GSC','Posicion_GSC'},
    'ga4': {'URL_Slug','Sesiones_Organicas','Conversion_Rate','AOV'},
    'merchant': {'Stock','Precio','Categoria','Marca'},
    'ads': {'CPC','Gasto_Ads'},
    'trends': {'Volumen_Mercado','Tendencia_Mercado','Tendencia_Marca','Tendencia_Sustancia'},
}

def _stamp(value: Optional[str]) -> str:
    if value:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat().replace('+00:00','Z')
    return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')

def _fingerprint(value: Any) -> str:
    raw=json.dumps(value, sort_keys=True, ensure_ascii=False, default=str, separators=(',',':'))
    return sha256(raw.encode('utf-8')).hexdigest()

def _sku_index(products: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    index={}
    for product in products:
        sku=str(product.get('SKU') or '').strip()
        if sku:
            index[sku]=deepcopy(product)
    return index

def synchronize_batch(catalog: Iterable[Dict[str, Any]], source: str,
                      rows: Iterable[Dict[str, Any]], synced_at: Optional[str]=None,
                      expected_ctr: float=0.10) -> Dict[str, Any]:
    """Apply one source batch by SKU; reject ambiguous duplicate keys and track freshness.

    Existing fields are retained when absent from a source row. Only fields owned by
    the source are overwritten. Rows with unknown SKU are rejected rather than silently
    creating incomplete catalog products.
    """
    if source not in SOURCE_FIELDS:
        raise ValueError(f'Fuente no soportada: {source}')
    timestamp=_stamp(synced_at)
    products=_sku_index(catalog)
    source_rows=list(rows)
    normalized=[]; errors=[]; seen=set()
    for idx, raw in enumerate(source_rows, start=1):
        if not isinstance(raw, dict):
            errors.append({'row':idx,'reason':'row_not_object'}); continue
        try:
            row=normalize_row(source, raw)
        except (ValueError, TypeError) as exc:
            errors.append({'row':idx,'reason':'invalid_row','detail':str(exc)}); continue
        sku=str(row.get('SKU') or '').strip()
        if not sku:
            url=str(row.get('URL_Slug') or raw.get('landingPage') or raw.get('url') or '').strip()
            matches=[p.get('SKU') for p in products.values() if url and str(p.get('URL_Slug') or '').rstrip('/')==url.rstrip('/')]
            if len(matches)==1:
                sku=str(matches[0]); row['SKU']=sku
            else:
                errors.append({'row':idx,'reason':'missing_sku' if not url or not matches else 'ambiguous_url'}); continue
        if sku in seen:
            errors.append({'row':idx,'sku':sku,'reason':'duplicate_sku_in_batch'}); continue
        seen.add(sku)
        if sku not in products:
            # GSC/GA4 can identify a product by URL when SKU is unavailable only if catalog mapping is explicit.
            url=str(row.get('URL_Slug') or raw.get('landingPage') or raw.get('url') or '').strip()
            matches=[p.get('SKU') for p in products.values() if url and str(p.get('URL_Slug') or '').rstrip('/')==url.rstrip('/')]
            if len(matches)==1: sku=matches[0]; row['SKU']=sku
            else:
                errors.append({'row':idx,'sku':sku,'reason':'sku_not_in_catalog'}); continue
        normalized.append((sku,row,idx))
    updated=0; unchanged=0; changed_skus=[]
    for sku,row,idx in normalized:
        product=products[sku]
        before=_fingerprint(product)
        for field in SOURCE_FIELDS[source]:
            if field in row and row[field] is not None:
                product[field]=row[field]
        provenance=product.setdefault('_sync',{})
        source_meta=provenance.setdefault(source,{})
        payload_hash=_fingerprint({k:row[k] for k in sorted(SOURCE_FIELDS[source]) if k in row})
        source_meta.update({'synced_at':timestamp,'row_hash':payload_hash,'status':'success','row_number':idx})
        if _fingerprint(product)!=before:
            updated+=1; changed_skus.append(sku)
        else: unchanged+=1
    calculated=[calculate_product(p,expected_ctr) for p in products.values()]
    # Preserve source metadata and expose a compact audit trail for downstream UI.
    for p in calculated:
        p['_sync']=products[p['SKU']].get('_sync',{})
    return {
      'sync_version':'1.0','source':source,'synced_at':timestamp,
      'status':'partial' if errors else 'success','received':len(source_rows),
      'accepted':len(normalized),'updated':updated,'unchanged':unchanged,
      'rejected':len(errors),'errors':errors,'changed_skus':changed_skus,
      'products':calculated,'product_count':len(calculated),
      'batch_hash':_fingerprint({'source':source,'rows':source_rows}),
      'source_freshness':_freshness(calculated),
    }

def _freshness(products: List[Dict[str, Any]]) -> Dict[str, Any]:
    sources={}
    for product in products:
        for source, meta in product.get('_sync',{}).items():
            entry=sources.setdefault(source,{'latest_sync':None,'products_synced':0,'products_missing':0})
            stamp=meta.get('synced_at')
            if stamp and (entry['latest_sync'] is None or stamp>entry['latest_sync']): entry['latest_sync']=stamp
            entry['products_synced']+=1
    for source in SOURCE_FIELDS:
        sources.setdefault(source,{'latest_sync':None,'products_synced':0,'products_missing':len(products)})
    for source, entry in sources.items():
        entry['products_missing']=max(0,len(products)-entry['products_synced'])
        entry['coverage']=round(entry['products_synced']/len(products),4) if products else 0
    return sources
