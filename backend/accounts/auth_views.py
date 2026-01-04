from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def register(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', username)
        
        if not username or not password:
            return JsonResponse({'error': 'Username and password required'}, status=400)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        if email and User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        
        user = User.objects.create_user(
            username=username,
            email=email or '',
            password=password,
            first_name=name
        )
        
        login(request, user)
        
        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': user.first_name or user.username
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def login_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({'error': 'Username and password required'}, status=400)
        
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
        
        login(request, user)
        
        return JsonResponse({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': user.first_name or user.username
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def logout_view(request):
    if request.method == "OPTIONS":
        return JsonResponse({}, status=200)
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})


@require_http_methods(["GET"])
def current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'name': request.user.first_name or request.user.username
        })
    return JsonResponse({'error': 'Not authenticated'}, status=401)


@require_http_methods(["GET"])
def csrf_token(request):
    """Get CSRF token for frontend"""
    from django.middleware.csrf import get_token
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

