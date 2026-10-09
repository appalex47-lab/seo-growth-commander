from pathlib import Path

ROOT = Path(__file__).parents[1]


def test_ci_workflow_exists_and_runs_local_gate():
    workflow = (ROOT / '.github/workflows/ci.yml').read_text()
    assert 'pull_request' in workflow
    assert 'push:' in workflow
    assert 'python scripts/ci_check.py' in workflow


def test_local_ci_gate_is_executable_and_secret_free():
    script = (ROOT / 'scripts/ci_check.py').read_text()
    assert 'pytest' in script
    assert 'node' in script
    assert 'http' in script.lower()
    assert 'COHERE_API_KEY' not in script


def test_phase10_documentation_exists():
    doc = (ROOT / 'docs/phases/fase-10.md').read_text()
    assert 'Automatización y CI' in doc
    assert 'Fuera de alcance' in doc
