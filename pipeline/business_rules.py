"""Motor determinista de métricas y reglas de negocio del Growth SEO Command Center."""

EXPECTED_CTR_DEFAULT = 0.10
STOCK_MINIMUM = 5
HIGH_VOLUME_MIN = 50_000
QUICK_WIN_POSITION = (4, 15)
PROTECT_POSITION = (1, 3)
CONTENT_GAP_POSITION_MIN = 20
PRIORITY_BY_CLASS = {
    'QUICK_WIN': 1,
    'PROTEGER': 2,
    'CONTENT_GAP': 3,
    'ANOMALIA': 4,
    'IGNORAR': 5,
}


def _num(p, key):
    value = p.get(key)
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else None


def data_quality(p):
    """Return deterministic quality status without changing business values."""
    required_for_business = ('Stock', 'Posicion_GSC', 'Conversion_Rate', 'AOV', 'Volumen_Mercado', 'Clicks_GSC')
    missing = [k for k in required_for_business if p.get(k) is None]
    invalid = []
    stock = _num(p, 'Stock')
    position = _num(p, 'Posicion_GSC')
    conversion = _num(p, 'Conversion_Rate')
    volume = _num(p, 'Volumen_Mercado')
    clicks = _num(p, 'Clicks_GSC')
    aov = _num(p, 'AOV')
    if stock is not None and stock < 0: invalid.append('Stock negativo')
    if position is not None and position < 1: invalid.append('Posición GSC menor a 1')
    if conversion is not None and not 0 <= conversion <= 1: invalid.append('Conversion_Rate fuera de 0..1')
    for key, value in [('AOV', aov), ('Volumen_Mercado', volume), ('Clicks_GSC', clicks)]:
        if value is not None and value < 0: invalid.append(f'{key} negativo')
    if invalid:
        return {'status': 'INVALID', 'missing': missing, 'issues': invalid}
    if missing:
        return {'status': 'INCOMPLETE', 'missing': missing, 'issues': []}
    return {'status': 'VALID', 'missing': [], 'issues': []}


def classify(p):
    """Apply business classification with explicit precedence.

    Incomplete/invalid calculation inputs become ANOMALIA. A known stock below
    the operational threshold becomes IGNORAR. This preserves the distinction
    between a known stock constraint and missing source data.
    """
    quality = data_quality(p)
    if quality['status'] != 'VALID':
        return 'ANOMALIA'

    stock = p['Stock']
    position = p['Posicion_GSC']
    volume = p['Volumen_Mercado']
    if stock < STOCK_MINIMUM:
        return 'IGNORAR'
    if QUICK_WIN_POSITION[0] <= position <= QUICK_WIN_POSITION[1] and volume >= HIGH_VOLUME_MIN:
        return 'QUICK_WIN'
    if PROTECT_POSITION[0] <= position <= PROTECT_POSITION[1] and volume >= HIGH_VOLUME_MIN:
        return 'PROTEGER'
    if volume >= HIGH_VOLUME_MIN and position > CONTENT_GAP_POSITION_MIN:
        return 'CONTENT_GAP'
    return 'ANOMALIA'


def potential_clicks(p, expected_ctr=EXPECTED_CTR_DEFAULT):
    volume = _num(p, 'Volumen_Mercado')
    if volume is None or expected_ctr is None:
        return None
    return max(0, volume * expected_ctr)


def revenue_gap(p, expected_ctr=EXPECTED_CTR_DEFAULT):
    """Revenue Gap = max(0, (Potential Traffic - Clicks) × CR × AOV)."""
    potential = potential_clicks(p, expected_ctr)
    clicks = _num(p, 'Clicks_GSC')
    conversion = _num(p, 'Conversion_Rate')
    aov = _num(p, 'AOV')
    if None in (potential, clicks, conversion, aov):
        return None
    return max(0, (potential - clicks) * conversion * aov)


def organic_search_share(p):
    impressions = _num(p, 'Impresiones_GSC')
    volume = _num(p, 'Volumen_Mercado')
    if None in (impressions, volume) or volume <= 0:
        return None
    return impressions / volume


def priority(p):
    return PRIORITY_BY_CLASS.get(p.get('Clasificacion'), 4)


def calculate_product(p, expected_ctr=EXPECTED_CTR_DEFAULT):
    result = dict(p)
    result['Data_Quality'] = data_quality(p)['status']
    result['Potential_Traffic'] = potential_clicks(p, expected_ctr)
    result['Revenue_Gap'] = revenue_gap(p, expected_ctr)
    result['Organic_Search_Share'] = organic_search_share(p)
    result['Clasificacion'] = classify(p)
    result['Prioridad'] = priority(result)
    return result


def calculate_dataset(products, expected_ctr=EXPECTED_CTR_DEFAULT):
    return [calculate_product(p, expected_ctr) for p in products]
