"""
Cleanly organized tests and manual integration tester for accounts app.
- Section 1: Pytest unit tests (isolated, DB-backed)
- Section 2: Manual integration test utility (requests-based, runnable via __main__)
"""

# =========================
# Imports
# =========================
import json
from datetime import datetime

import pytest
import requests
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

# =========================
# Shared configuration for integration tester
# =========================
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"


# =========================
# Section 1: Pytest unit tests
# =========================
pytestmark = pytest.mark.django_db


def get_tokens(client: APIClient, username: str, password: str):
    resp = client.post(reverse('accounts:token_obtain_pair'), {
        'username': username,
        'password': password,
    })
    assert resp.status_code == 200
    return resp.json()


def test_me_and_logout():
    User = get_user_model()
    User.objects.create_user(username='alice', password='secret', email='alice@example.com')
    client = APIClient()
    tokens = get_tokens(client, 'alice', 'secret')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    me_url = reverse('accounts:me')
    me_resp = client.get(me_url)
    assert me_resp.status_code == 200
    assert me_resp.json()['username'] == 'alice'

    logout_url = reverse('accounts:logout')
    out_resp = client.post(logout_url)
    assert out_resp.status_code == 200


# =========================
# Section 2: Manual integration test utility (run directly, not collected by pytest)
# =========================

#!/usr/bin/env python3
"""
Test script to verify Django-React auth integration
Run this after applying the fixes to validate your auth flow
"""


class AuthFlowTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Origin': FRONTEND_URL,
            'Referer': FRONTEND_URL,
        })
        self.csrf_token = None
        self.access_token = None
        self.user_data = None

    def test_csrf_seeding(self):
        """Test CSRF token acquisition"""
        print("1. Testing CSRF token seeding...")

        response = self.session.get(f"{BASE_URL}/api/auth/csrf/")

        if response.status_code == 200:
            # Extract CSRF token from cookies
            csrf_cookie = response.cookies.get('csrftoken')
            if csrf_cookie:
                self.csrf_token = csrf_cookie
                self.session.headers['X-CSRFToken'] = csrf_cookie
                print(f"   ✓ CSRF token acquired: {csrf_cookie[:12]}...")
                return True
            else:
                print("   ✗ No CSRF cookie in response")
                return False
        else:
            print(f"   ✗ CSRF endpoint failed: {response.status_code}")
            return False

    def test_registration(self, email="test@example.com", password="TestPassword123!"):
        """Test user registration"""
        print("2. Testing user registration...")

        payload = {
            "email": email,
            "password": password,
            "password_confirm": password,
            "first_name": "Test",
            "last_name": "User",
            "user_type": "freelancer",
            "username": email,
            "terms_accepted": True,
            "privacy_policy_accepted": True,
            "marketing_consent": False,
            "analytics_consent": False,
        }

        response = self.session.post(
            f"{BASE_URL}/api/auth/register/",
            data=json.dumps(payload)
        )

        if response.status_code == 201:
            data = response.json()
            self.access_token = data['tokens']['access']
            self.user_data = data['user']
            self.session.headers['Authorization'] = f'Bearer {self.access_token}'
            print(f"   ✓ Registration successful for {email}")
            print(f"   ✓ Access token: {self.access_token[:20]}...")
            return True
        else:
            print(f"   ✗ Registration failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   ✗ Error: {error_data}")
            except:
                print(f"   ✗ Raw response: {response.text}")
            return False

    def test_me_endpoint(self):
        """Test authenticated user endpoint"""
        print("3. Testing /me endpoint...")

        response = self.session.get(f"{BASE_URL}/api/auth/me/")

        if response.status_code == 200:
            user_data = response.json()
            print(f"   ✓ User data retrieved: {user_data['email']}")
            return True
        else:
            print(f"   ✗ /me endpoint failed: {response.status_code}")
            return False

    def test_profile_update(self):
        """Test profile update (CSRF required)"""
        print("4. Testing profile update...")

        payload = {
            "first_name": "Updated",
            "marketing_consent": True
        }

        response = self.session.patch(
            f"{BASE_URL}/api/auth/me/",
            data=json.dumps(payload)
        )

        if response.status_code == 200:
            updated_data = response.json()
            print(f"   ✓ Profile updated: {updated_data['first_name']}")
            return True
        else:
            print(f"   ✗ Profile update failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   ✗ Error: {error_data}")
            except:
                print(f"   ✗ Raw response: {response.text}")
            return False

    def test_logout(self):
        """Test logout"""
        print("5. Testing logout...")

        response = self.session.post(f"{BASE_URL}/api/auth/logout/")

        if response.status_code == 200:
            print("   ✓ Logout successful")
            return True
        else:
            print(f"   ✗ Logout failed: {response.status_code}")
            return False

    def test_login(self, email="test@example.com", password="TestPassword123!"):
        """Test user login"""
        print("6. Testing login...")

        payload = {
            "email": email,
            "password": password
        }

        response = self.session.post(
            f"{BASE_URL}/api/auth/login/",
            data=json.dumps(payload)
        )

        if response.status_code == 200:
            data = response.json()
            self.access_token = data['tokens']['access']
            self.session.headers['Authorization'] = f'Bearer {self.access_token}'
            print("   ✓ Login successful")
            return True
        else:
            print(f"   ✗ Login failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   ✗ Error: {error_data}")
            except:
                pass
            return False

    def test_refresh_token(self):
        """Test token refresh from cookie"""
        print("7. Testing token refresh...")

        response = self.session.post(f"{BASE_URL}/api/auth/refresh/")

        if response.status_code == 200:
            data = response.json()
            new_access = data['access']
            print(f"   ✓ Token refreshed: {new_access[:20]}...")
            return True
        else:
            print(f"   ✗ Token refresh failed: {response.status_code}")
            return False

    def run_full_test(self):
        """Run complete authentication flow test"""
        print(f"Starting authentication flow test at {datetime.now()}")
        print(f"Backend: {BASE_URL}")
        print(f"Frontend: {FRONTEND_URL}")
        print("=" * 50)

        results = []
        test_email = f"test-{datetime.now().timestamp()}@example.com"

        # Run tests in sequence
        results.append(self.test_csrf_seeding())
        results.append(self.test_registration(email=test_email))
        results.append(self.test_me_endpoint())
        results.append(self.test_profile_update())
        results.append(self.test_logout())
        results.append(self.test_login(email=test_email))
        results.append(self.test_refresh_token())

        print("=" * 50)
        passed = sum(results)
        total = len(results)

        if passed == total:
            print(f"🎉 All tests passed! ({passed}/{total})")
            print("Your authentication system is working correctly.")
        else:
            print(f"❌ {total - passed} tests failed ({passed}/{total} passed)")
            print("Check the error messages above and verify your settings.")

        return passed == total


if __name__ == "__main__":
    tester = AuthFlowTester()
    tester.run_full_test()
