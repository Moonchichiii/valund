from django.apps import AppConfig


class ContractsConfig(AppConfig):
    name = "contracts"
    verbose_name = "Contracts"

    def ready(self):  # pragma: no cover
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
