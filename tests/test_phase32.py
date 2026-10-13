from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_phase32_audit_document_exists_and_covers_live_validation():
    doc = ROOT / "FASE_32_AUDITORIA_FINAL_GA4_GSC.md"
    assert doc.exists()
    content = doc.read_text(encoding="utf-8")
    assert "No validado" in content
    assert "OAuth" in content
    assert "Search Console" in content
    assert "Criterios de aceptación" in content


def test_audit_explicitly_covers_channel_and_ambiguous_skus():
    content = (ROOT / "FASE_32_AUDITORIA_FINAL_GA4_GSC.md").read_text(encoding="utf-8")
    assert "canal `organic` y canal `all`" in content
    assert "ambigua" in content
    assert "no asigne métricas automáticamente" in content
