# Generated manually: remove mood field from Thought
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_thought'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='thought',
            name='mood',
        ),
    ]
