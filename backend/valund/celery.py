"""
Celery configuration for valund project.
"""

import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'valund.settings')

app = Celery('valund')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    'cleanup-expired-bookings': {
        'task': 'bookings.tasks.cleanup_expired_bookings',
        'schedule': 3600.0,  # Every hour
    },
    'process-pending-payments': {
        'task': 'payments.tasks.process_pending_payments',
        'schedule': 300.0,  # Every 5 minutes
    },
    'update-search-index': {
        'task': 'search.tasks.update_search_index',
        'schedule': 1800.0,  # Every 30 minutes
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')