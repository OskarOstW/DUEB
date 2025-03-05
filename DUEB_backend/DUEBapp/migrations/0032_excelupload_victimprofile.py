# Generated by Django 5.0.1 on 2025-01-19 17:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0031_formresponse_note_timestamps'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExcelUpload',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='excel_uploads/')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='VictimProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('profile_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('category', models.CharField(blank=True, max_length=200, null=True)),
            ],
        ),
    ]
