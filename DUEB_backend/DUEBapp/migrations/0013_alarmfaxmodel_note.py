# Generated by Django 5.0.1 on 2024-01-14 00:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0012_remove_alarmfaxmodel_image_alarmfaxmodel_image1_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='note',
            field=models.TextField(blank=True, null=True),
        ),
    ]
