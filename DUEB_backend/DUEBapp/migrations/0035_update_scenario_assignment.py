# Generated by Django 5.0.1 on 2025-01-21 13:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0034_alter_organization_short_code'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='scenarioassignment',
            options={'ordering': ['sequential_number']},
        ),
        migrations.AddField(
            model_name='testscenario',
            name='description',
            field=models.TextField(blank=True, help_text='Beschreibung des Szenarios (z.B. Art des Unfalls)', null=True),
        ),
    ]
