"""Service layer for contract operations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Contract, ContractEvent, ContractSignature, ContractTemplate

User = get_user_model()


@dataclass
class SignatureRequest:
    contract: Contract
    user: any
    role: str
    ip: Optional[str] = None
    user_agent: str = ""
    signature_type: str = ContractSignature.SignatureType.TYPED


def create_contract(
    *,
    company: User,
    talent: User,
    title: str,
    body: str = "",
    template: ContractTemplate | None = None,
) -> Contract:
    snapshot = body or (template.body if template else "")
    contract = Contract.objects.create(
        company=company,
        talent=talent,
        template=template,
        title=title,
        body_snapshot=snapshot,
    )
    ContractEvent.objects.create(contract=contract, event_type="created")
    return contract


def send_for_signature(contract: Contract):
    contract.send_for_signature()
    ContractEvent.objects.create(contract=contract, event_type="sent_for_signature")
    return contract


@transaction.atomic
def sign_contract(req: SignatureRequest) -> ContractSignature:
    if req.contract.status in [Contract.Status.VOID, Contract.Status.EXPIRED]:
        raise ValueError("Cannot sign void or expired contract")
    role = req.role
    sig = ContractSignature.objects.create(
        contract=req.contract,
        signer=req.user,
        role=role,
        ip_address=req.ip,
        user_agent=req.user_agent[:300],
        signature_type=req.signature_type,
    )
    ContractEvent.objects.create(
        contract=req.contract, event_type="signed", metadata={"role": role}
    )
    return sig


def void_contract(contract: Contract, reason: str, user: User | None = None):
    contract.void(reason=reason)
    ContractEvent.objects.create(
        contract=contract,
        event_type="voided",
        metadata={"reason": reason, "by": getattr(user, "id", None)},
    )
    return contract
