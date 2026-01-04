from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    health,
    HabitViewSet,
    ExpenseViewSet,
    CategoryViewSet,
    TaskViewSet,
    NoteViewSet,
    TimerSessionViewSet,
    QuadrantViewSet,
    QuadrantTaskViewSet,
)
from .auth_views import register, login_view, logout_view, current_user, csrf_token

router = DefaultRouter()
router.register('habits', HabitViewSet, basename='habit')
router.register('expenses', ExpenseViewSet, basename='expense')
router.register('categories', CategoryViewSet, basename='category')
router.register('tasks', TaskViewSet, basename='task')  # used by Todo feature
router.register('notes', NoteViewSet, basename='note')
router.register('timer-sessions', TimerSessionViewSet, basename='timer-session')
router.register('quadrants', QuadrantViewSet, basename='quadrant')  # quadrant configs (optional)
router.register('quadrant-tasks', QuadrantTaskViewSet, basename='quadrant-task')  # Eisenhower tasks

urlpatterns = [
    path('health/', health, name='api-health'),
    path('auth/register/', register, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/user/', current_user, name='current-user'),
    path('auth/csrf/', csrf_token, name='csrf-token'),
    path('', include(router.urls)),
]
