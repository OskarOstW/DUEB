# admin.py - Django Admin-Konfiguration für die DÜB-Anwendung
# 
# Diese Datei konfiguriert das Django-Admin-Interface für die DÜB-Anwendung (Digitale Übungsbeobachtung).
# Es werden benutzerdefinierte Admin-Klassen für verschiedene Modelle definiert, um die Verwaltung 
# von Formularen, Fragen, Opferprofilen, Organisationen, Testszenarien und anderen Elementen 
# zu erleichtern und anzupassen.

import openpyxl
from django.contrib import admin, messages
from django.db.models import Count, Max
from django.http import HttpResponseRedirect
from django.urls import path
from . import admin_excelupload
from .models import (
    Form, Question, Option, FormResponse,
    Contact, HomeScreenImage,
    VictimProfile,
    Organization, TestScenario, TestScenarioVictim,
    ObserverAccount,  # Neu: Beobachterkonto
    VictimProfileResponse  # Neu: Neues Modell für Antwortdaten
)
from .pillow_utils import generate_overview_image

# ------------------------------------------------
# 1) ADMIN-KLASSEN FÜR FORMULAR-MODELLE
# ------------------------------------------------

class OptionInline(admin.TabularInline):
    """Inline-Verwaltung für Antwortoptionen innerhalb einer Frage"""
    model = Option
    extra = 0


class QuestionInline(admin.StackedInline):
    """Inline-Verwaltung für Fragen innerhalb eines Formulars"""
    model = Question
    extra = 0
    inlines = [OptionInline]


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für das Form-Modell (Formulare)"""
    inlines = [QuestionInline]
    list_display = ['_name', '_note']
    search_fields = ['name']

    def _name(self, obj):
        return obj.name

    def _note(self, obj):
        return obj.note


@admin.register(FormResponse)
class FormResponseAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Formularantworten"""
    list_display = ['_form', '_observer_name', '_observer_email', '_submitted_at']
    readonly_fields = ['submitted_at']

    def _form(self, obj):
        return obj.form.name if obj.form else "-"

    def _observer_name(self, obj):
        return obj.observer_name

    def _observer_email(self, obj):
        return obj.observer_email

    def _submitted_at(self, obj):
        return obj.submitted_at


# ------------------------------------------------
# 2) ADMIN-KLASSEN FÜR KONTAKTE UND BILDER
# ------------------------------------------------

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Kontaktdaten"""
    list_display = ['_first_name', '_last_name', '_phone_number', '_email']
    search_fields = ['first_name', 'last_name', 'email']

    def _first_name(self, obj):
        return obj.first_name

    def _last_name(self, obj):
        return obj.last_name

    def _phone_number(self, obj):
        return obj.phone_number

    def _email(self, obj):
        return obj.email


@admin.register(HomeScreenImage)
class HomeScreenImageAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Startbildschirm-Bilder"""
    list_display = ['_id', '_description']

    def _id(self, obj):
        return obj.id

    def _description(self, obj):
        return obj.description


# ------------------------------------------------
# 3) ADMIN-KLASSEN FÜR OPFERPROFILE
# ------------------------------------------------

@admin.register(VictimProfile)
class VictimProfileAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Opferprofile"""
    list_display = [
        '_profile_number',
        '_category',
        '_diagnosis',
        '_lastname',
        '_firstname'
    ]
    search_fields = [
        'profile_number', 'category', 'diagnosis',
        'lastname', 'firstname'
    ]
    list_filter = ['category']

    def _profile_number(self, obj):
        return obj.profile_number

    def _category(self, obj):
        return obj.category

    def _diagnosis(self, obj):
        return obj.diagnosis

    def _lastname(self, obj):
        return obj.lastname

    def _firstname(self, obj):
        return obj.firstname


# ------------------------------------------------
# 4) ADMIN-KLASSEN FÜR ORGANISATIONEN UND TESTSZENARIEN
# ------------------------------------------------

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Organisationen"""
    list_display = ['_name', '_short_code']
    search_fields = ['name', 'short_code']

    def _name(self, obj):
        return obj.name

    def _short_code(self, obj):
        return obj.short_code


class TestScenarioVictimInline(admin.TabularInline):
    """Inline-Verwaltung für Opfer innerhalb eines Testszenarios"""
    model = TestScenarioVictim
    extra = 1
    fields = (
        'sequential_number',
        'victim_profile',
        'organization',
        'button_number'
    )
    readonly_fields = ('sequential_number', 'button_number')
    ordering = ('sequential_number',)

    def get_formset(self, request, obj=None, **kwargs):
        """Überschreibt Formset mit Validierung für Organizations"""
        formset = super().get_formset(request, obj, **kwargs)

        class ValidatedForm(formset.form):
            def clean(self):
                cleaned_data = super().clean()
                if cleaned_data.get('victim_profile') and not cleaned_data.get('organization'):
                    raise ValueError("Eine Organisation muss ausgewählt werden.")
                return cleaned_data

        formset.form = ValidatedForm
        widget = formset.form.base_fields['victim_profile'].widget
        widget.can_add_related = False
        widget.can_delete_related = False
        return formset

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Sortiert Opferprofile nach Kategorie und Profilnummer für die Auswahlbox"""
        if db_field.name == "victim_profile":
            kwargs["queryset"] = VictimProfile.objects.all().order_by('category', 'profile_number')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(TestScenario)
class TestScenarioAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Testszenarien mit umfangreichen Funktionen"""
    list_display = ['_name', '_date', 'get_total_profiles', 'get_category_summary']
    search_fields = ['name', 'description']
    fields = ['name', 'date', 'description']
    inlines = [TestScenarioVictimInline]
    change_form_template = 'admin/testscenario_change_form.html'

    def _name(self, obj):
        return obj.name
    _name.short_description = "Name"

    def _date(self, obj):
        return obj.date.strftime('%d.%m.%Y') if obj.date else "-"
    _date.short_description = "Datum der Krankenhausübung"

    def get_total_profiles(self, obj):
        """Gibt die Gesamtzahl der zugewiesenen Profile zurück"""
        return obj.assignments.count()
    get_total_profiles.short_description = "Anzahl Profile"

    def get_category_summary(self, obj):
        """Erzeugt eine Zusammenfassung der Profilkategorien"""
        stats = self.get_profile_stats(obj)
        return ", ".join([f"{cat}: {count}" for cat, count in stats.items()])
    get_category_summary.short_description = "Kategorien"

    def get_profile_stats(self, obj):
        """Berechnet Statistiken über die Verteilung der Profile nach Kategorien"""
        from collections import defaultdict
        stats = defaultdict(int)
        for assignment in obj.assignments.all():
            category = assignment.victim_profile.category or 'Ohne Kategorie'
            stats[category] += 1
        return dict(stats)

    def get_urls(self):
        """Fügt benutzerdefinierte URLs für die Übersichtserzeugung hinzu"""
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:scenario_id>/generate_overview/',
                self.admin_site.admin_view(self.generate_overview_view),
                name='scenario-generate-overview',
            ),
        ]
        return custom_urls + urls

    def generate_overview_view(self, request, scenario_id):
        """Erzeugt eine Bildübersicht für das Szenario als PNG-Datei"""
        scenario = self.get_object(request, scenario_id)
        if scenario:
            try:
                all_assignments = scenario.assignments.select_related("victim_profile").all()
                entries_for_image = []
                for asn in all_assignments:
                    vp = asn.victim_profile
                    cat = vp.category.strip() if vp.category else ""
                    entries_for_image.append({
                        "button_number": asn.button_number,
                        "profile_number": vp.profile_number or "",
                        "category": cat,
                        "diagnosis": vp.diagnosis or "",
                        "visual": vp.visual_diagnosis or "",
                        "pcz": vp.pcz_ivena or "",
                    })

                rel_path = generate_overview_image(
                    entries_for_image,
                    scenario_name=scenario.name,
                    date_str=scenario.date
                )

                new_image = HomeScreenImage(
                    image=rel_path,
                    description=f"Übersicht für Szenario {scenario.name} vom {scenario.date.strftime('%d.%m.%Y')}"
                )
                new_image.save()
                messages.success(request, "Verletztenübersicht wurde erfolgreich erstellt!")
            except Exception as e:
                messages.error(request, f"Fehler beim Erstellen der Übersicht: {str(e)}")
        return HttpResponseRedirect("../")

    def has_add_permission(self, request):
        """Erlaubt nur ein Testszenario gleichzeitig"""
        if TestScenario.objects.exists():
            return False
        return super().has_add_permission(request)

    def add_view(self, request, form_url='', extra_context=None):
        """Zeigt eine Warnung, wenn bereits ein Testszenario existiert"""
        extra_context = extra_context or {}
        if TestScenario.objects.exists():
            messages.warning(
                request,
                "Es existiert bereits ein Testszenario. "
                "Löschen Sie dieses zuerst, bevor Sie ein neues anlegen."
            )
        return super().add_view(request, form_url, extra_context=extra_context)

    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Erweitert die Änderungsansicht mit statistischen Daten"""
        extra_context = extra_context or {}
        scenario = self.get_object(request, object_id)
        if scenario:
            total_count = scenario.assignments.count()
            category_stats = self.get_profile_stats(scenario)
            extra_context.update({
                'show_statistics': True,
                'total_profiles': total_count,
                'category_statistics': [
                    {
                        'category': cat,
                        'count': count,
                        'percentage': (count / total_count * 100) if total_count else 0
                    }
                    for cat, count in category_stats.items()
                ],
                'has_profiles': total_count > 0
            })
        return super().change_view(request, object_id, form_url, extra_context=extra_context)

    def save_formset(self, request, form, formset, change):
        """Verarbeitet das Speichern von Inline-Formularen und generiert Button-Nummern"""
        instances = formset.save(commit=False)
        if not instances:
            return formset.save()

        org_counters = {}
        scenario_obj = instances[0].scenario if instances else None

        for instance in instances:
            if instance.victim_profile and not instance.organization:
                formset.add_error(None, "Bitte wählen Sie für jedes Profil eine Organisation aus.")
                return
            if not instance.sequential_number and instance.organization:
                org_id = instance.organization.id
                if org_id not in org_counters:
                    max_val = scenario_obj.assignments.filter(organization=instance.organization) \
                                   .aggregate(Max('sequential_number'))['sequential_number__max'] or 0
                    org_counters[org_id] = max_val
                org_counters[org_id] += 1
                instance.sequential_number = org_counters[org_id]
                instance.button_number = f"{instance.organization.short_code}{instance.sequential_number:02d}"
            instance.save()
        formset.save_m2m()

    def save_model(self, request, obj, form, change):
        """Speichert das Modell und behandelt Fehler mit Benutzerbenachrichtigungen"""
        try:
            super().save_model(request, obj, form, change)
        except Exception as e:
            messages.error(request, f"Fehler beim Speichern: {str(e)}")


# ------------------------------------------------
# 5) ADMIN-KLASSEN FÜR BEOBACHTER UND ANTWORTDATEN
# ------------------------------------------------

@admin.register(ObserverAccount)
class ObserverAccountAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Beobachterkonten"""
    list_display = ['username', 'first_name', 'last_name', 'email', 'show_patient_profiles']
    filter_horizontal = ['allowed_forms']


@admin.register(VictimProfileResponse)
class VictimProfileResponseAdmin(admin.ModelAdmin):
    """Admin-Konfiguration für Patientenbegleitbogen-Antworten"""
    list_display = [
        'id',
        'button_number',
        'kh_intern',
        'observer_name',
        'observer_email',
        'soll_sichtung',
        'ist_sichtung',
        'erstellt_am',
        'aktualisiert_am'
    ]
    search_fields = [
        'button_number',
        'kh_intern',
        'observer_name',
        'observer_email',
        'soll_sichtung',
        'ist_sichtung'
    ]
    list_filter = [
        'erstellt_am',
        'ist_sichtung',
        'soll_sichtung',
        'observer_name'
    ]
    fieldsets = (
        (None, {
            'fields': ('button_number', 'kh_intern', 'observer_name', 'observer_email', 'soll_sichtung', 'ist_sichtung')
        }),
        ('Diagnostische Angaben', {
            'fields': ('diagnostic_loaded', 'vitalwerte'),
            'classes': ('collapse',)
        }),
        ('Sichtungs- und Behandlungsdaten', {
            'fields': ('sichtung_data', 'diagnostik_data', 'therapie_data'),
            'classes': ('collapse',)
        }),
        ('OP-Team und Verlaufseinträge', {
            'fields': ('op_team', 'verlauf'),
            'classes': ('collapse',)
        }),
        ('Zeitstempel', {
            'fields': ('erstellt_am', 'aktualisiert_am'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('erstellt_am', 'aktualisiert_am')
