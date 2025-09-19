# ================================
# STAGE 1: Dependencies Builder
# ================================
FROM python:3.12-slim-bookworm AS dependencies

# Build environment (no sensitive data)
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gcc \
        libc6-dev \
        pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies to user directory
COPY requirements.txt /tmp/requirements.txt
RUN pip install --user --no-warn-script-location -r /tmp/requirements.txt

# ================================
# STAGE 2: Static Files Builder
# ================================
FROM python:3.12-slim-bookworm AS static-builder

# Copy installed packages from dependencies stage
COPY --from=dependencies /root/.local /root/.local
ENV PATH="/root/.local/bin:$PATH"

# Install minimal runtime dependencies for static collection
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy application code
COPY . /app/

# Create static files (using dummy values for collection only)
ENV DATABASE_URL=sqlite:///tmp/dummy.db \
    ALLOWED_HOSTS=localhost

RUN python manage.py collectstatic --noinput --clear

# ================================
# STAGE 3: Production Runtime
# ================================
FROM python:3.12-slim-bookworm AS production

# Runtime environment variables (no sensitive data)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PYTHONHASHSEED=random \
    PATH="/home/appuser/.local/bin:$PATH" \
    DEBIAN_FRONTEND=noninteractive

# Security updates and minimal runtime dependencies
RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        postgresql-client \
        curl \
        ca-certificates \
        dumb-init \
        jq \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && find /usr/local -depth \
        \( \
            \( -type d -a \( -name test -o -name tests -o -name idle_test \) \) \
            -o \
            \( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
        \) -exec rm -rf '{}' + \
    && find /usr/local -name '*.a' -delete

# Create non-root user with minimal privileges
RUN groupadd --gid 1001 --system appuser \
    && useradd --uid 1001 --system --gid appuser \
       --home-dir /home/appuser --create-home \
       --shell /bin/false appuser

# Copy Python packages from dependencies stage
COPY --from=dependencies --chown=appuser:appuser /root/.local /home/appuser/.local

# Set working directory
WORKDIR /app

# Copy application code with proper ownership
COPY --from=static-builder --chown=appuser:appuser /app /app

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/tmp \
    && chown -R appuser:appuser /app \
    && chmod -R 755 /app

# Create secrets loading script
COPY --chown=appuser:appuser scripts/load-secrets.sh /usr/local/bin/load-secrets.sh
RUN chmod +x /usr/local/bin/load-secrets.sh

# Switch to non-root user
USER appuser

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Expose port
EXPOSE 8000

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Load secrets and start application
CMD ["/usr/local/bin/load-secrets.sh", "gunicorn", "valund.asgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--worker-connections", "1000", \
     "--max-requests", "1200", \
     "--max-requests-jitter", "100", \
     "--timeout", "30", \
     "--keep-alive", "5", \
     "--preload-app", \
     "--worker-tmp-dir", "/dev/shm", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]

# ================================
# STAGE 4: Development Target
# ================================
FROM production AS development

# Switch back to root to install dev dependencies
USER root

# Install development tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        vim \
        procps \
        htop \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install development Python packages
COPY requirements-dev.txt* /tmp/
RUN if [ -f /tmp/requirements-dev.txt ]; then \
        pip install --no-cache-dir -r /tmp/requirements-dev.txt; \
    fi

# Switch back to appuser
USER appuser

# Development command with auto-reload (no secrets loading needed in dev)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
