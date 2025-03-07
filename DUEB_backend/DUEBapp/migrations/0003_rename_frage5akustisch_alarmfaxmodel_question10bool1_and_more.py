# Generated by Django 5.0 on 2024-01-05 03:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0002_rename_acoustic_signal_alarmfaxmodel_frage5akustisch_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='alarmfaxmodel',
            old_name='frage5Akustisch',
            new_name='question10Bool1',
        ),
        migrations.RenameField(
            model_name='alarmfaxmodel',
            old_name='frage5Optisch',
            new_name='question10Bool2',
        ),
        migrations.RenameField(
            model_name='alarmfaxmodel',
            old_name='isPhoneMonitored',
            new_name='question10Bool3',
        ),
        migrations.RenameField(
            model_name='alarmfaxmodel',
            old_name='signalAudible',
            new_name='question12Bool',
        ),
        migrations.RenameField(
            model_name='alarmfaxmodel',
            old_name='signalVisible',
            new_name='question3Bool',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='additionalInformation',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='alarmAssignment',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='areasWhereSignalIsSeenOrHeard',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='byWhom',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='decisionAndActions',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='externalAlarmSystem',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='externalFallback',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='frage1Input',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='frage2Input',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='frage3Input',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='howIsItMonitored',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='informationPassedTo',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='internalAlarmSystem',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='internalFallback',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='personReceivingAlarm',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='reasonNotAudible',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='reasonNotVisible',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='redPhoneLocation',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='signalDescription',
        ),
        migrations.RemoveField(
            model_name='alarmfaxmodel',
            name='signalDescriptionAlways',
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question10Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question11Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question12Input1',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question12Input2',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question13Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question14Input1',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question14Input2',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question15Input1',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question15Input2',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question1Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question2Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question3Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question4Bool',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question5Bool1',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question5Bool2',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question6Bool',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question6Input1',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question6Input2',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question7Bool',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question7Input1',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question7Input2',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question8Input',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question9Input1',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='alarmfaxmodel',
            name='question9Input2',
            field=models.TextField(blank=True),
        ),
    ]
