from django.middleware.csrf import get_token


class EnsureCSRFCookieOnSafeMethodsMiddleware:
    """
    Guarantee a CSRF cookie on SAFE methods so SPAs have a token before the first POST.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            get_token(request)
        return self.get_response(request)
