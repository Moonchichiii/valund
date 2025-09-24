import hashlib
import hmac
import ipaddress
import logging
import re
import secrets
from typing import Any, Dict, Optional

import requests
from django.conf import settings
from django.core.cache import cache
from user_agents import parse

logger = logging.getLogger(__name__)

def get_client_ip(request) -> str:
    """Get the real client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP in the chain
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

    # Validate IP address
    try:
        ipaddress.ip_address(ip)
        return ip
    except ValueError:
        logger.warning(f"Invalid IP address detected: {ip}")
        return '127.0.0.1'

def get_user_agent(request) -> str:
    """Get and sanitize user agent string"""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    # Truncate to prevent abuse
    return user_agent[:500] if user_agent else 'Unknown'

def generate_device_fingerprint(request) -> str:
    """Generate a device fingerprint for session tracking"""
    user_agent = get_user_agent(request)
    accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
    accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')

    # Create fingerprint from browser characteristics
    fingerprint_data = f"{user_agent}|{accept_language}|{accept_encoding}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]

def get_location_from_ip(ip_address: str) -> str:
    """Get approximate location from IP address"""
    cache_key = f"ip_location_{ip_address}"
    location = cache.get(cache_key)

    if location:
        return location

    # Skip for local/private IPs
    try:
        ip_obj = ipaddress.ip_address(ip_address)
        if ip_obj.is_private or ip_obj.is_loopback:
            return "Local Network"
    except ValueError:
        return "Unknown"

    try:
        # Use a free IP geolocation service (replace with your preferred service)
        response = requests.get(
            f"https://ipapi.co/{ip_address}/json/",
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            city = data.get('city', '')
            country = data.get('country_name', '')

            if city and country:
                location = f"{city}, {country}"
            elif country:
                location = country
            else:
                location = "Unknown"

            # Cache for 24 hours
            cache.set(cache_key, location, 86400)
            return location

    except Exception as e:
        logger.warning(f"Failed to get location for IP {ip_address}: {e}")

    return "Unknown"

def detect_suspicious_activity(ip_address: str, email: Optional[str] = None,
                             activity_type: str = 'login') -> bool:
    """Detect suspicious authentication activity"""

    # Check IP-based rate limiting
    ip_cache_key = f"auth_attempts_{activity_type}_{ip_address}"
    ip_attempts = cache.get(ip_cache_key, 0)

    if ip_attempts >= 20:  # 20 attempts per hour per IP
        return True

    # Check email-based rate limiting
    if email:
        email_cache_key = f"auth_attempts_{activity_type}_{email}"
        email_attempts = cache.get(email_cache_key, 0)

        if email_attempts >= 10:  # 10 attempts per hour per email
            return True

        # Increment email counter
        cache.set(email_cache_key, email_attempts + 1, 3600)

    # Increment IP counter
    cache.set(ip_cache_key, ip_attempts + 1, 3600)

    # Check for known malicious IPs (you can integrate with threat intelligence)
    if is_malicious_ip(ip_address):
        return True

    return False

def is_malicious_ip(ip_address: str) -> bool:
    """Check if IP is in known malicious IP list"""
    cache_key = f"malicious_ip_{ip_address}"
    result = cache.get(cache_key)

    if result is not None:
        return result

    # List of known malicious IP ranges or integrate with threat intelligence
    malicious_patterns = [
        # Add known bad IP patterns here
        # '192.168.1.',  # Example
    ]

    is_malicious = any(ip_address.startswith(pattern) for pattern in malicious_patterns)

    # Cache result for 1 hour
    cache.set(cache_key, is_malicious, 3600)
    return is_malicious

def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength with detailed feedback"""
    issues = []
    score = 0

    # Length check
    if len(password) < 12:
        issues.append("Password must be at least 12 characters long")
    else:
        score += 2

    # Character variety checks
    if not re.search(r'[a-z]', password):
        issues.append("Password must contain lowercase letters")
    else:
        score += 1

    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain uppercase letters")
    else:
        score += 1

    if not re.search(r'\d', password):
        issues.append("Password must contain numbers")
    else:
        score += 1

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Password must contain special characters")
    else:
        score += 1

    # Common patterns check
    common_patterns = [
        r'123456',
        r'password',
        r'qwerty',
        r'(.)\1{3,}',  # Repeated characters
        r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)',
    ]

    for pattern in common_patterns:
        if re.search(pattern, password.lower()):
            issues.append("Password contains common patterns")
            score -= 1
            break

    # Calculate strength
    if score >= 5:
        strength = "Strong"
    elif score >= 3:
        strength = "Medium"
    else:
        strength = "Weak"

    return {
        'is_valid': len(issues) == 0,
        'strength': strength,
        'score': max(0, score),
        'issues': issues
    }

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(length)

def verify_hmac_signature(message: str, signature: str, secret: str) -> bool:
    """Verify HMAC signature for webhook security"""
    expected_signature = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

def sanitize_user_input(data: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not isinstance(data, str):
        return str(data)

    # Remove potential XSS patterns
    xss_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload=',
        r'onerror=',
        r'onclick=',
    ]

    cleaned = data
    for pattern in xss_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.DOTALL)

    return cleaned.strip()

def log_security_event(user, event_type: str, request, details: Dict = None):
    """Log security events with comprehensive details"""
    from .models import SecurityLog

    SecurityLog.objects.create(
        user=user,
        event_type=event_type,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        session_key=getattr(request.session, 'session_key', ''),
        details=details or {}
    )

def parse_user_agent(user_agent_string: str) -> Dict[str, str]:
    """Parse user agent string to extract browser and OS info"""
    try:
        user_agent = parse(user_agent_string)
        return {
            'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
            'os': f"{user_agent.os.family} {user_agent.os.version_string}",
            'device': user_agent.device.family,
            'is_mobile': user_agent.is_mobile,
            'is_tablet': user_agent.is_tablet,
            'is_pc': user_agent.is_pc,
            'is_bot': user_agent.is_bot
        }
    except Exception:
        return {
            'browser': 'Unknown',
            'os': 'Unknown',
            'device': 'Unknown',
            'is_mobile': False,
            'is_tablet': False,
            'is_pc': True,
            'is_bot': False
        }

def check_password_breach(password: str) -> bool:
    """Check if password has been found in data breaches using HaveIBeenPwned API"""
    try:
        # Hash the password
        sha1_password = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix = sha1_password[:5]
        suffix = sha1_password[5:]

        # Query HaveIBeenPwned API
        response = requests.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=5
        )

        if response.status_code == 200:
            # Check if our password hash suffix is in the response
            hashes = response.text.split('\n')
            for hash_line in hashes:
                hash_suffix, count = hash_line.split(':')
                if hash_suffix == suffix:
                    logger.warning(f"Password found in {count} breaches")
                    return True

        return False

    except Exception as e:
        logger.warning(f"Failed to check password breach status: {e}")
        # Fail open - don't block user if service is down
        return False

class SecurityMiddleware:
    """Custom security middleware for additional protection"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add security headers
        response = self.get_response(request)

        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Only add HSTS in production
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        return response
