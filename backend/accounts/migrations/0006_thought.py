# Generated manually for Thought model
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_financecategory_alter_expense_category_taskcategory_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Thought',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('motivational', 'Motivational'), ('focus', 'Focus'), ('calm', 'Calm'), ('gratitude', 'Gratitude'), ('confidence', 'Confidence'), ('custom', 'Custom')], default='motivational', max_length=32)),
                ('mood', models.CharField(blank=True, max_length=64)),
                ('text', models.TextField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='thoughts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
    ]
