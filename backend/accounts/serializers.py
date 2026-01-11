from rest_framework import serializers
from .models import Habit, Expense, FinanceCategory, TaskCategory, Task, Note, Quadrant, QuadrantTask, Thought


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ['id', 'name', 'frequency', 'created_at', 'completed_by_date', 'paused']
        read_only_fields = ['id', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'title', 'amount', 'date', 'time', 'description', 'is_recurring', 'category', 'category_name']
        read_only_fields = ['id', 'category_name']


class FinanceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceCategory
        fields = ['id', 'name', 'color', 'budget']
        read_only_fields = ['id']

class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = ['id', 'name', 'color']
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




class QuadrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quadrant
        fields = '__all__'


class QuadrantTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuadrantTask
        fields = ['id', 'quadrant', 'text', 'deadline', 'time', 'completed', 'created_at']
        read_only_fields = ['id', 'created_at']


class ThoughtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thought
        fields = ['id', 'category', 'text', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
