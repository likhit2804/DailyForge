from django.db import models
from django.contrib.auth.models import User

class Habit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=255)
    frequency = models.IntegerField(default=1)
    created_at = models.DateField(auto_now_add=True)
    completed_by_date = models.JSONField(default=dict, blank=True)  # {"2026-01-02": true, ...}
    paused = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    class Meta:
        ordering = ['-created_at']


class FinanceCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='finance_categories')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default='#cbd5e0')
    budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name']

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_recurring = models.BooleanField(default=False)
    category = models.ForeignKey(FinanceCategory, on_delete=models.CASCADE, related_name='expenses')
    
    def __str__(self):
        return f"{self.user.username} - {self.title} - ${self.amount}"
    
    class Meta:
        ordering = ['-date', '-id']


class TaskCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_categories')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default='#cbd5e0')
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name']



class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    category = models.ForeignKey(TaskCategory, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.category.name})"
    
    class Meta:
        ordering = ['-created_at']


class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    category = models.CharField(max_length=255, blank=True)
    color = models.CharField(max_length=20, default='#fef08a')
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    class Meta:
        ordering = ['-updated_at']

class Quadrant(models.Model):
    """Represents a named quadrant configuration for a user (e.g. Eisenhower matrix cells)."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quadrants', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default='#ffffff')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    class Meta:
        ordering = ['name']


class QuadrantTask(models.Model):
    """Task that lives in one of the four quadrants, independent from Category/Task used by Todo."""

    QUADRANT_CHOICES = [
        ('urgent_important', 'Urgent & Important'),
        ('not_urgent_important', 'Important, Not Urgent'),
        ('urgent_not_important', 'Urgent, Not Important'),
        ('not_urgent_not_important', 'Neither Urgent nor Important'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quadrant_tasks')
    quadrant = models.CharField(max_length=50, choices=QUADRANT_CHOICES, default='urgent_important')
    text = models.CharField(max_length=255)
    deadline = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.text} ({self.quadrant})"

    class Meta:
        ordering = ['-created_at']


class Thought(models.Model):
    """Short text snippets shown in the global banner, grouped by category/mood."""

    CATEGORY_CHOICES = [
        ('motivational', 'Motivational'),
        ('focus', 'Focus'),
        ('calm', 'Calm'),
        ('gratitude', 'Gratitude'),
        ('confidence', 'Confidence'),
        ('custom', 'Custom'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='thoughts')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='motivational')
    text = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.category}: {self.text[:40]}"

    class Meta:
        ordering = ['-updated_at']


class Achievement(models.Model):
    """Represents a user milestone that can be filtered by calendar date."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    date_earned = models.DateField()
    category = models.CharField(max_length=120, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.date_earned})"

    class Meta:
        ordering = ['-date_earned', '-created_at']
