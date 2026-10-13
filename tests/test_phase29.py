from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / 'frontend/js/integrations.js').read_text(encoding='utf-8')


def test_ga4_has_multiple_report_dimensions():
    assert "date:[{name:'date'}]" in JS
    assert "landingPage:[{name:'landingPage'}]" in JS
    assert "sourceMedium:[{name:'sessionSourceMedium'}]" in JS
    assert "channel:[{name:'sessionDefaultChannelGroup'}]" in JS


def test_ga4_has_global_period_comparison_helper():
    assert 'previousEquivalentRange(period)' in JS
    assert 'startDate:fmt(start),endDate:fmt(end),days' in JS


def test_ga4_report_has_comparison_columns():
    assert 'Periodo seleccionado</th><th>Periodo anterior</th><th>Variación' in JS
    assert "previousSummary[key]" in JS


def test_ga4_displays_global_period_and_selected_dimension():
    assert 'getGlobalPeriod()' in JS
    assert "root.querySelector('#ga4-dimension')" in JS
    assert 'desglose: ${escapeHtml(dimension)}' in JS


def test_ga4_aggregates_rows_before_summary_comparison():
    assert "rows.reduce((acc,item)=>" in JS
    assert "Number(item[key]||0)" in JS


def test_ga4_keeps_real_api_and_organic_filter():
    assert 'analyticsdata.googleapis.com/v1beta/properties/' in JS
    assert "value:'Organic Search'" in JS
    assert 'No se pudo consultar GA4:' in JS
