import os
import xml.etree.ElementTree as ET

import pytest

APPS = [
    "accounts",
    "bookings",
    "competence",
    "payments",
    "ratings",
    "search",
    "contracts",
]
MIN_COVERAGE = 92.0


def test_per_app_coverage():
    xml_path = "coverage.xml"
    if not os.path.exists(xml_path):  # pragma: no cover
        pytest.skip("Coverage XML not produced")
    tree = ET.parse(xml_path)
    root = tree.getroot()
    packages = {pkg.attrib["name"]: pkg for pkg in root.findall(".//package")}
    failures = []
    for app in APPS:
        pkg = packages.get(app)
        if not pkg:
            continue
        lines = int(pkg.attrib["lines-valid"])
        covered = int(pkg.attrib["lines-covered"])
        pct = (covered / lines * 100) if lines else 100.0
        if pct < MIN_COVERAGE:
            failures.append(f"{app}: {pct:.2f}% < {MIN_COVERAGE}%")
    if failures:
        pytest.fail("Per-app coverage below threshold:\n" + "\n".join(failures))
