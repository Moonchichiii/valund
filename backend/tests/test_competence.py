from datetime import timedelta
from django.utils import timezone
from .factories import (
    CompetenceDocumentFactory,
    CompetenceTemplateFactory,
    CompetenceAuditLogFactory,
)


def test_competence_document_save_sets_file_size(db):
    doc = CompetenceDocumentFactory()
    assert doc.file_size > 0


def test_competence_document_is_expired(db):
    doc = CompetenceDocumentFactory(
        expiry_date=timezone.now().date() - timedelta(days=1)
    )
    assert doc.is_expired is True


def test_competence_template_str(db):
    tpl = CompetenceTemplateFactory()
    assert tpl.name in str(tpl)


def test_competence_audit_log_str(db):
    log = CompetenceAuditLogFactory()
    assert log.action in str(log)
