import pytest
from contracts.models import Contract, ContractSignature
from contracts.services import (
    SignatureRequest,
    create_contract,
    send_for_signature,
    sign_contract,
    void_contract,
)
from django.db import IntegrityError

from .factories import (
    ContractFactory,
    ContractTemplateFactory,
    UserFactory,
)


@pytest.mark.django_db
def test_create_contract_from_template():
    template = ContractTemplateFactory()
    company = UserFactory(user_type="client")
    talent = UserFactory(user_type="freelancer")
    contract = create_contract(
        company=company, talent=talent, title="Engagement", template=template
    )
    assert contract.body_snapshot == template.body
    assert contract.body_checksum == template.checksum


@pytest.mark.django_db
def test_signature_workflow_and_status_change():
    c = ContractFactory()
    send_for_signature(c)
    assert c.status == Contract.Status.PENDING
    # company signs
    sign_contract(
        SignatureRequest(
            contract=c, user=c.company, role=ContractSignature.Role.COMPANY
        )
    )
    c.refresh_from_db()
    assert c.status == Contract.Status.PENDING  # still pending, second signer missing
    # talent signs
    sign_contract(
        SignatureRequest(contract=c, user=c.talent, role=ContractSignature.Role.TALENT)
    )
    c.refresh_from_db()
    assert c.status == Contract.Status.SIGNED
    assert c.finalized_at is not None


@pytest.mark.django_db
def test_prevent_duplicate_signature():
    c = ContractFactory()
    send_for_signature(c)
    sign_contract(
        SignatureRequest(
            contract=c, user=c.company, role=ContractSignature.Role.COMPANY
        )
    )
    with pytest.raises(IntegrityError):
        sign_contract(
            SignatureRequest(
                contract=c, user=c.company, role=ContractSignature.Role.COMPANY
            )
        )


@pytest.mark.django_db
def test_void_contract():
    c = ContractFactory()
    send_for_signature(c)
    void_contract(c, reason="Cancelled")
    c.refresh_from_db()
    assert c.status == Contract.Status.VOID


@pytest.mark.django_db
def test_checksum_changes_on_body_update():
    c = ContractFactory()
    old_checksum = c.body_checksum
    c.body_snapshot = c.body_snapshot + " extra"
    c.save()
    assert c.body_checksum != old_checksum
