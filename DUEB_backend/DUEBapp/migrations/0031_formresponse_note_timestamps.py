# Generated by Django 5.0.1 on 2024-12-31 17:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0030_delete_homescreencontent'),
    ]

    operations = [
        migrations.AddField(
            model_name='formresponse',
            name='note_timestamps',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
