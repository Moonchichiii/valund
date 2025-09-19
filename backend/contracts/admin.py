from django.contrib import admin

from .models import Contract, ContractEvent, ContractSignature, ContractTemplate


@admin.register(ContractTemplate)
class ContractTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "version", "is_active", "created_at")
    search_fields = ("name", "version")
    list_filter = ("is_active", "created_at")


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "talent", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("title", "company__email", "talent__email")


@admin.register(ContractSignature)
class ContractSignatureAdmin(admin.ModelAdmin):
    list_display = ("contract", "signer", "role", "signed_at", "is_valid")
    list_filter = ("role", "signed_at", "is_valid")
    search_fields = ("contract__title", "signer__email")


@admin.register(ContractEvent)
class ContractEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "contract", "created_at")
    list_filter = ("event_type", "created_at")
    search_fields = ("contract__title",)
