# Generated by Django 5.0.1 on 2024-01-08 15:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0003_rename_frage5akustisch_alarmfaxmodel_question10bool1_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='alarmfax_images/'),
        ),
    ]
