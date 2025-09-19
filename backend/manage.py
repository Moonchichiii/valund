#!/usr/bin/env python
"""Django's command-line utility for administrative tasks.

Enhanced to guard against an invalid DJANGO_SETTINGS_MODULE environment variable
that still points at 'backend.settings.*' which no longer exists. This situation
was causing 'No module named backend' import errors during manage.py commands.
"""
import os
import sys
from pathlib import Path


def _fix_settings_env():
    current = os.environ.get("DJANGO_SETTINGS_MODULE", "")
    # Any stale value referencing the old pattern gets replaced.
    if current.startswith("backend.settings") or not current:
        os.environ["DJANGO_SETTINGS_MODULE"] = "valund.settings"

    # Ensure backend directory (this file's parent) is on sys.path so that the
    # 'valund' package (project module) is importable even when executed from repo root.
    backend_dir = Path(__file__).resolve().parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def main():
    """Run administrative tasks with environment fixes."""
    _fix_settings_env()
    try:
        from django.core.management import (
            execute_from_command_line,  # noqa: WPS433 (allowed here)
        )
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH? "
            "Did you forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":  # pragma: no cover
    main()
