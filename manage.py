#!/usr/bin/env python
"""Top-level manage.py wrapper.

This allows deployment platforms or developers that expect a project-level
manage.py at the repository root to run Django commands without cd-ing into
`backend/`. It simply injects the backend directory on sys.path and delegates
execution to Django using the single-file settings module `valund.settings`.

Usage examples (from repo root):
    python manage.py runserver
    python manage.py migrate
    python manage.py createsuperuser

If you previously exported DJANGO_SETTINGS_MODULE pointing at a non-existent
module like `backend.settings.development`, unset it (PowerShell):
    Remove-Item Env:DJANGO_SETTINGS_MODULE

This script will set DJANGO_SETTINGS_MODULE to `valund.settings` when not set.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Determine backend directory (where the real manage.py and apps live)
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "valund.settings")

from django.core.management import execute_from_command_line  # noqa: E402


def main() -> None:
    execute_from_command_line(sys.argv)


if __name__ == "__main__":  # pragma: no cover
    main()
