# Generated by Django 5.0.1 on 2024-11-19 16:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0026_question_hint'),
    ]

    operations = [
        migrations.AddField(
            model_name='formresponse',
            name='image_11',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/'),
        ),
        migrations.AddField(
            model_name='formresponse',
            name='image_12',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/'),
        ),
        migrations.AddField(
            model_name='formresponse',
            name='image_13',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/'),
        ),
        migrations.AddField(
            model_name='formresponse',
            name='image_14',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/'),
        ),
        migrations.AddField(
            model_name='formresponse',
            name='image_15',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/'),
        ),
    ]
