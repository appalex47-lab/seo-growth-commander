from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_diagnostics_are_integrated_after_successful_gsc_query():
    js = (ROOT / "frontend/js/integrations.js").read_text(encoding="utf-8")
    assert "renderGscDiagnostics" in js
    assert "renderGscDiagnostics(rows,{siteUrl,startDate,endDate})" in js

def test_diagnostics_follow_fact_signal_hypothesis_and_scope_contract():
    js = (ROOT / "frontend/js/gscDiagnostics.js").read_text(encoding="utf-8")
    for phrase in ["Hecho", "Driver", "Señal", "Hipótesis por validar", "filas devueltas por la API", "position >= 4"]:
        assert phrase in js

def test_diagnostics_handle_empty_rows_and_escape_dimension_values():
    js = (ROOT / "frontend/js/gscDiagnostics.js").read_text(encoding="utf-8")
    assert "No hay filas que cumplan el umbral" in js
    assert "safe(r.key" in js
    assert "const n = value => Number.isFinite(Number(value)) ? Number(value) : 0" in js
