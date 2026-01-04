from rest_framework import serializers
from .models import Habit, Expense, Category, Task, Note, TimerSession, Quadrant, QuadrantTask


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ['id', 'name', 'frequency', 'created_at', 'completed_by_date', 'paused']
        read_only_fields = ['id', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'title', 'amount', 'date', 'time', 'description', 'is_recurring', 'category']
        read_only_fields = ['id']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'budget']
        read_only_fields = ['id']


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'category', 'title', 'description', 'completed', 'created_at']
        read_only_fields = ['id', 'created_at']


class NoteSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'category', 'color', 'pinned', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class TimerSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimerSession
        fields = ['id', 'duration', 'task_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class QuadrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quadrant
        fields = '__all__'


class QuadrantTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuadrantTask
        fields = ['id', 'quadrant', 'text', 'deadline', 'time', 'completed', 'created_at']
        read_only_fields = ['id', 'created_at']
