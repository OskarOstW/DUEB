# Generated by Django 5.0.1 on 2024-03-04 21:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0013_alarmfaxmodel_note'),
    ]

    operations = [
        migrations.CreateModel(
            name='Form',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('note', models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question_text', models.CharField(max_length=255)),
                ('option_type', models.CharField(choices=[('none', 'None'), ('checkbox', 'Checkbox'), ('dropdown', 'Dropdown'), ('scale', 'Scale')], max_length=50)),
                ('input_field_added', models.BooleanField(default=False)),
                ('form', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='DUEBapp.form')),
            ],
        ),
        migrations.CreateModel(
            name='Option',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=255)),
                ('type', models.CharField(choices=[('checkbox', 'Checkbox'), ('dropdown', 'Dropdown')], max_length=50)),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='options', to='DUEBapp.question')),
            ],
        ),
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='question_images/')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='DUEBapp.question')),
            ],
        ),
    ]
