# Generated by Django 5.0.1 on 2024-03-04 21:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0014_form_question_option_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='image',
            name='image',
            field=models.ImageField(max_length=500, upload_to='question_images/'),
        ),
    ]
