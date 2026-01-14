from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Habit, Expense, FinanceCategory,Task, TaskCategory, Note, Quadrant, QuadrantTask, Thought, Achievement
from .serializers import (
    HabitSerializer, ExpenseSerializer, FinanceCategorySerializer, TaskCategorySerializer,
    TaskSerializer, NoteSerializer,
    QuadrantSerializer, QuadrantTaskSerializer,
    ThoughtSerializer, AchievementSerializer,
)

def health(request):
    return JsonResponse({
        "status": "ok",
        "app": "django-backend",
    })


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        print(f"HabitViewSet.get_queryset: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            qs = Habit.objects.filter(user=self.request.user)
            print(f"  -> returning {qs.count()} habits for user {self.request.user.username}")
            return qs
        print("  -> user not authenticated, returning empty queryset")
        return Habit.objects.none()
    
    def perform_create(self, serializer):
        print(f"HabitViewSet.perform_create: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
            print(f"  -> habit saved for user {self.request.user.username}")
        else:
            print("  -> user not authenticated, cannot save habit")
            raise PermissionError("User not authenticated")

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        """Toggle or set completion for a habit on a specific date.

        Expects JSON body: {"date": "YYYY-MM-DD", "value": true/false}
        """
        print("📥 HabitViewSet.toggle: entered")
        print(f"  user={request.user}, is_authenticated={request.user.is_authenticated}")
        print(f"  data={request.data}")

        if not request.user.is_authenticated:
            print("  -> user not authenticated in toggle")
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        habit = self.get_object()
        print(f"  -> toggling habit id={habit.id}, name={habit.name}, owner={habit.user}")

        date = request.data.get('date')
        if not date:
            print("  -> missing 'date' in request body")
            return Response({"error": "'date' is required"}, status=status.HTTP_400_BAD_REQUEST)

        raw_value = request.data.get('value', True)
        # Coerce to boolean if coming as string
        value = raw_value
        if isinstance(raw_value, str):
            value = raw_value.lower() in ['1', 'true', 'yes', 'on']

        print(f"  -> date={date}, value(raw)={raw_value}, value(bool)={value}")

        data = habit.completed_by_date or {}
        print("  -> current completed_by_date:", data)

        if value:
            data[date] = True
        else:
            if date in data:
                del data[date]

        habit.completed_by_date = data
        habit.save()
        print("  -> updated completed_by_date:", habit.completed_by_date)

        serializer = self.get_serializer(habit)
        response_data = serializer.data
        print("📤 HabitViewSet.toggle: returning serialized habit:", response_data)
        return Response(response_data)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Expense.objects.filter(user=self.request.user)
        return Expense.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)




class FinanceCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = FinanceCategorySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        print(f"FinanceCategoryViewSet.get_queryset: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            return FinanceCategory.objects.filter(user=self.request.user)
        return FinanceCategory.objects.none()
    
    def perform_create(self, serializer):
        print(f"FinanceCategoryViewSet.perform_create: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")

class TaskCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCategorySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        print(f"TaskCategoryViewSet.get_queryset: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            return TaskCategory.objects.filter(user=self.request.user)
        return TaskCategory.objects.none()      
    def perform_create(self, serializer):
        print(f"TaskCategoryViewSet.perform_create: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        print(f"TaskViewSet.get_queryset: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            return Task.objects.filter(user=self.request.user)
        return Task.objects.none()
    
    def perform_create(self, serializer):
        print(f"TaskViewSet.perform_create: user={self.request.user}, is_authenticated={self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")
    
    def create(self, request, *args, **kwargs):
        print("TaskViewSet.create: Received data:", request.data)
        return super().create(request, *args, **kwargs)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Note.objects.filter(user=self.request.user)
        return Note.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)


class QuadrantViewSet(viewsets.ModelViewSet):
    """CRUD for per-user quadrant configurations (metadata), not tasks."""

    serializer_class = QuadrantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        print(
            f"QuadrantViewSet.get_queryset: user={self.request.user}, "
            f"is_authenticated={self.request.user.is_authenticated}"
        )
        if self.request.user.is_authenticated:
            return Quadrant.objects.filter(user=self.request.user)
        return Quadrant.objects.none()

    def perform_create(self, serializer):
        print(
            f"QuadrantViewSet.perform_create: user={self.request.user}, "
            f"is_authenticated={self.request.user.is_authenticated}"
        )
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")


class QuadrantTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Eisenhower quadrant tasks, separate from Category/Task used by Todo."""

    serializer_class = QuadrantTaskSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        print(
            f"QuadrantTaskViewSet.get_queryset: user={self.request.user}, "
            f"is_authenticated={self.request.user.is_authenticated}"
        )
        if self.request.user.is_authenticated:
            return QuadrantTask.objects.filter(user=self.request.user)
        return QuadrantTask.objects.none()

    def perform_create(self, serializer):
        print(
            f"QuadrantTaskViewSet.perform_create: user={self.request.user}, "
            f"is_authenticated={self.request.user.is_authenticated}"
        )
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")


class ThoughtViewSet(viewsets.ModelViewSet):
    """CRUD for banner thoughts."""

    serializer_class = ThoughtSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Thought.objects.none()

        qs = Thought.objects.filter(user=self.request.user)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        # Only show active thoughts by default
        active = self.request.query_params.get('active')
        if active is None or str(active).lower() in ['1', 'true', 'yes', 'on']:
            qs = qs.filter(is_active=True)

        return qs

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")


class AchievementViewSet(viewsets.ModelViewSet):
    """CRUD for user achievements with calendar filtering client-side."""

    serializer_class = AchievementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Achievement.objects.none()

        queryset = Achievement.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date_earned=date_param)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("User not authenticated")
