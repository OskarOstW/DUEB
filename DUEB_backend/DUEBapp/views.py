# views.py - Django Rest Framework Views für die DÜB-Anwendung
# Diese Datei enthält alle ViewSets und API-Views, die die Hauptfunktionalitäten
# der DÜB-Anwendung (Digitale Übungsbeobachtung) bereitstellen. Die Views verarbeiten 
# HTTP-Anfragen, führen Geschäftslogik aus und geben Antworten an Clients zurück.

from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.db.models import Max
from django.core.exceptions import ValidationError
from datetime import datetime  # Fehlender Import
from django.conf import settings  # Fehlender Import für settings.DEBUG
from django.db import transaction

import copy  # <-- WICHTIG für das Klonen von Profilobjekten

from .models import (
    Form, Question, Option, FormResponse,
    Contact, HomeScreenImage,
    VictimProfile, ExcelUpload,
    Organization, TestScenario, TestScenarioVictim,
    ObserverAccount, VictimProfileResponse  # NEU: Import des neuen Modells
)
from .serializers import (
    FormSerializer, QuestionSerializer, OptionSerializer, FormResponseSerializer,
    FormResponseImageSerializer, ContactSerializer, HomeScreenImageSerializer,
    VictimProfileSerializer, ExcelUploadSerializer,
    OrganizationSerializer, TestScenarioSerializer,
    TestScenarioVictimSerializer, ObserverAccountSerializer,
    VictimProfileResponseSerializer  # NEU: Import des neuen Serializers
)
from .email_and_excel import send_confirmation_email
from .email_and_excel_victimprofiles import send_victimprofiles_email


# -------------------------------
# 1) FORM, QUESTION, OPTION, FORMRESPONSE
# -------------------------------

class FormViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Formularen.
    Ermöglicht CRUD-Operationen auf Form-Objekte mit Authentifizierung.
    """
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtert die Formulare nach Namen, falls ein Namenparameter in der Anfrage vorhanden ist.
        """
        queryset = super().get_queryset()
        name = self.request.query_params.get('name')
        if name is not None:
            queryset = queryset.filter(name=name)
        return queryset


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Fragen.
    Ermöglicht CRUD-Operationen auf Question-Objekte mit Authentifizierung.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]


class OptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Antwortoptionen.
    Ermöglicht CRUD-Operationen auf Option-Objekte mit Authentifizierung.
    """
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [IsAuthenticated]


class FormResponseViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Formularantworten.
    Ermöglicht CRUD-Operationen auf FormResponse-Objekte und bietet zusätzliche
    Funktionen für den Bildupload.
    """
    queryset = FormResponse.objects.all()
    serializer_class = FormResponseSerializer
    permission_classes = [IsAuthenticated]

    # Dummy-Token "observer" soll auch POST/PUT/PATCH dürfen
    def get_authenticators(self):
        """
        Überschreibt die Authentifizierungsmethode, um dem "observer"-Token
        spezielle Rechte zu gewähren.
        """
        auth = self.request.META.get('HTTP_AUTHORIZATION', '')
        if self.request.method in ['POST', 'PUT', 'PATCH'] and auth.strip() == "Token observer":
            return []
        return super().get_authenticators()

    def get_permissions(self):
        """
        Überschreibt die Berechtigungsprüfung, um dem "observer"-Token
        spezielle Rechte zu gewähren.
        """
        auth = self.request.META.get('HTTP_AUTHORIZATION', '')
        if self.request.method in ['POST', 'PUT', 'PATCH'] and auth.strip() == "Token observer":
            return []
        return super().get_permissions()

    def perform_create(self, serializer):
        """
        Wird beim Erstellen einer neuen Formularantwort ausgeführt.
        Fügt automatisch Name und E-Mail des Beobachters hinzu und sendet eine Bestätigungs-E-Mail.
        """
        auth_header = self.request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.strip() == "Token observer":
            # Neuer Code: Name/Email aus Request nehmen, fallback "Beobachter"/"unknown@observer"
            name = self.request.data.get("observer_name") or "Beobachter"
            email = self.request.data.get("observer_email") or "unknown@observer"
            form_response = serializer.save(
                observer_name=name,
                observer_email=email
            )
        else:
            user = self.request.user
            form_response = serializer.save(
                observer_name=user.get_full_name() or user.username,
                observer_email=user.email
            )
        send_confirmation_email(form_response)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_images(self, request, pk=None):
        """
        Zusätzliche Aktion zum Hochladen von Bildern für eine Formularantwort.
        """
        try:
            form_response = self.get_object()
        except FormResponse.DoesNotExist:
            return Response({"error": "FormResponse not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = FormResponseImageSerializer(form_response, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            send_confirmation_email(form_response)
            return Response({"message": "Bilder erfolgreich hochgeladen."}, status=200)
        return Response(serializer.errors, status=400)


# -------------------------------
# 2) CUSTOM AUTH + KONTAKTE
# -------------------------------

class CustomAuthToken(ObtainAuthToken):
    """
    Angepasste Authentifizierungsklasse für die Token-Authentifizierung.
    Erweitert die Standardimplementierung mit zusätzlichen Debugging-Informationen.
    """
    def post(self, request, *args, **kwargs):
        """
        Verarbeitet POST-Anfragen zur Token-Authentifizierung und gibt den Token zurück.
        """
        print("[DEBUG] CustomAuthToken: Login attempt for user:", request.data.get("username"))
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        print("[DEBUG] CustomAuthToken: Token generated:", token.key)
        return Response({"token": token.key, "user_id": user.pk, "email": user.email})


class ContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Kontaktinformationen.
    Ermöglicht CRUD-Operationen auf Contact-Objekte mit Authentifizierung.
    """
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]


class HomeScreenImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Startbildschirm-Bildern.
    Ermöglicht CRUD-Operationen auf HomeScreenImage-Objekte mit Authentifizierung.
    """
    queryset = HomeScreenImage.objects.all()
    serializer_class = HomeScreenImageSerializer
    permission_classes = [IsAuthenticated]


# -------------------------------
# 3) PATIENTENPROFILE + EXCEL
# -------------------------------

class VictimProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Opferprofilen.
    Ermöglicht CRUD-Operationen auf VictimProfile-Objekte mit speziellen
    Authentifizierungsregeln für den Observer-Token.
    """
    queryset = VictimProfile.objects.all()
    serializer_class = VictimProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_authenticators(self):
        """
        Überschreibt die Authentifizierungsmethode, um dem "observer"-Token
        spezielle Leserechte zu gewähren.
        """
        auth = self.request.META.get('HTTP_AUTHORIZATION', '')
        if self.request.method == 'GET' and auth == 'Token observer':
            return []
        return super().get_authenticators()

    def get_permissions(self):
        """
        Überschreibt die Berechtigungsprüfung, um dem "observer"-Token
        spezielle Leserechte zu gewähren.
        """
        auth = self.request.META.get('HTTP_AUTHORIZATION', '')
        print("[DEBUG] VictimProfileViewSet: method =", self.request.method, "Auth Header:", auth)
        if self.request.method == 'GET' and auth == 'Token observer':
            print("[DEBUG] VictimProfileViewSet: GET request with observer token detected, allowing access.")
            return []
        return super().get_permissions()


class ExcelUploadViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Excel-Uploads.
    Ermöglicht das Hochladen und Verarbeiten von Excel-Dateien.
    """
    queryset = ExcelUpload.objects.all()
    serializer_class = ExcelUploadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Wird beim Erstellen eines neuen Excel-Uploads ausgeführt.
        Die eigentliche Datenverarbeitung findet in admin_excelupload.py statt.
        """
        serializer.save()


# -------------------------------
# 4) ORGANISATION + TESTSCENARIO
# -------------------------------

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Organisationen.
    Ermöglicht CRUD-Operationen auf Organization-Objekte mit Authentifizierung.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]


class TestScenarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Testszenarien.
    Ermöglicht CRUD-Operationen auf TestScenario-Objekte und bietet
    zusätzliche Aktionen für die Zuweisung von Profilen.
    """
    queryset = TestScenario.objects.all()
    serializer_class = TestScenarioSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Überschreibt die Standarderstellungsmethode, um sicherzustellen,
        dass nur ein TestScenario existiert.
        """
        if TestScenario.objects.exists():
            return Response(
                {"error": "Es existiert bereits ein Testszenario. Bitte löschen Sie es erst, bevor Sie ein neues anlegen."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            return super().create(request, *args, **kwargs)
        except ValidationError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='unassigned-profiles')
    def list_unassigned_profiles(self, request, pk=None):
        """
        Listet alle Profile auf, die dem TestScenario noch nicht zugewiesen sind.
        """
        scenario = self.get_object()
        assigned_ids = scenario.assignments.values_list('victim_profile_id', flat=True)
        profiles = VictimProfile.objects.exclude(id__in=assigned_ids)
        serializer = VictimProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=200)

    @action(detail=True, methods=['post'], url_path='assign-profiles')
    def assign_profiles(self, request, pk=None):
        """
        Weist dem TestScenario mehrere Profile auf einmal zu.
        """
        scenario = self.get_object()
        org_id = request.data.get("organization")
        profile_ids = request.data.get("profile_ids", [])

        if not org_id or not profile_ids:
            return Response({"error": "organization und profile_ids sind nötig."}, status=400)

        try:
            organization = Organization.objects.get(pk=org_id)
        except Organization.DoesNotExist:
            return Response({"error": "Organization existiert nicht."}, status=404)

        assigned_ids = []
        for pid in profile_ids:
            try:
                vp = VictimProfile.objects.get(pk=pid)
            except VictimProfile.DoesNotExist:
                continue
            max_org_num = scenario.assignments.filter(organization=organization)\
                                              .aggregate(Max('sequential_number'))['sequential_number__max'] or 0
            next_num = max_org_num + 1
            button_code = f"{organization.short_code}{next_num:02d}"
            TestScenarioVictim.objects.create(
                scenario=scenario,
                victim_profile=vp,
                organization=organization,
                sequential_number=next_num,
                button_number=button_code
            )
            assigned_ids.append(pid)
        return Response({"assigned_ids": assigned_ids}, status=200)


class TestScenarioVictimViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung der Beziehungen zwischen TestScenario und VictimProfile.
    Bietet spezielle Authentifizierungsregeln für Observer-Token und ermöglicht die Suche nach Button-Nummern.
    """
    queryset = TestScenarioVictim.objects.all()
    serializer_class = TestScenarioVictimSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['button_number', 'victim_profile__profile_number']

    def get_authenticators(self):
        """
        Überschreibt die Authentifizierungsmethode, um dem "observer"-Token
        spezielle Leserechte zu gewähren.
        """
        auth = self.request.META.get('HTTP_AUTHORIZATION', '')
        if (self.request.method == 'GET') and (auth == 'Token observer'):
            return []
        return super().get_authenticators()

    def get_queryset(self):
        """
        Filtert die Ergebnisse nach Szenario, falls ein entsprechender Parameter
        in der Anfrage vorhanden ist.
        """
        qs = super().get_queryset()
        scenario_id = self.request.query_params.get('scenario')
        if scenario_id:
            qs = qs.filter(scenario_id=scenario_id)
        return qs

    def get_permissions(self):
        """
        Überschreibt die Berechtigungsprüfung, um dem "observer"-Token
        spezielle Leserechte zu gewähren.
        """
        auth = self.request.META.get('HTTP_AUTHORIZATION', '')
        print("[DEBUG] TestScenarioVictimViewSet: method =", self.request.method, "Auth Header:", auth)
        if self.request.method == 'GET' and auth.strip() == 'Token observer':
            print("[DEBUG] TestScenarioVictimViewSet: GET request with observer token detected, allowing access.")
            return []
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """
        Überschreibt die Standarderstellungsmethode, um automatisch sequentielle
        Nummern und Button-Codes zu generieren.
        """
        scenario_id = request.data.get('scenario')
        profile_id = request.data.get('victim_profile')
        org_id = request.data.get('organization')

        if not (scenario_id and profile_id and org_id):
            return Response({"error": "Bitte scenario, victim_profile, organization angeben."}, status=400)

        try:
            scenario = TestScenario.objects.get(pk=scenario_id)
            org = Organization.objects.get(pk=org_id)
            vp = VictimProfile.objects.get(pk=profile_id)
        except (TestScenario.DoesNotExist, Organization.DoesNotExist, VictimProfile.DoesNotExist):
            return Response({"error": "Ungültige IDs."}, status=404)

        max_org_num = scenario.assignments.filter(organization=org)\
                                          .aggregate(Max('sequential_number'))['sequential_number__max'] or 0
        next_num = max_org_num + 1
        button_code = f"{org.short_code}{next_num:02d}"

        tv = TestScenarioVictim.objects.create(
            scenario=scenario,
            victim_profile=vp,
            organization=org,
            sequential_number=next_num,
            button_number=button_code
        )

        serializer = self.get_serializer(tv)
        return Response(serializer.data, status=201)


# -------------------------------
# 7) BEOBACHTER-KONTEN
# -------------------------------

class ObserverAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Beobachterkonten.
    Ermöglicht CRUD-Operationen auf ObserverAccount-Objekte mit Authentifizierung.
    """
    queryset = ObserverAccount.objects.all()
    serializer_class = ObserverAccountSerializer
    permission_classes = [IsAuthenticated]


# -------------------------------
# 8) SEND VICTIMPROFILES
# -------------------------------

class SendVictimProfilesView(APIView):
    """
    View für das Senden von Opferprofilen per E-Mail.
    Sammelt die Daten, erstellt E-Mails mit Excel-Anhängen und versendet sie.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        """
        Verarbeitet POST-Anfragen zum Versenden von Opferprofilen per E-Mail.
        Unterstützt sowohl alte als auch neue Datenstruktur und hat verschiedene Fallbacks.
        """
        # 1) Alte/new Struktur
        profile_mapping = request.data.get('profile_mapping', [])
        profile_data = request.data.get('profile_data', [])
        
        # Abwärtskompatibel
        if not profile_mapping and 'victim_profile_ids' in request.data:
            victim_profile_ids = request.data.get('victim_profile_ids', [])
            if not victim_profile_ids:
                return Response({'error': 'Keine victim_profile_ids oder profile_mapping übermittelt.'}, status=status.HTTP_400_BAD_REQUEST)
            
            profile_mapping = [{"victimProfileId": id_val, "buttonNumber": f"ID-{id_val}"} for id_val in victim_profile_ids]
            
        if not profile_mapping:
            return Response({'error': 'Kein profile_mapping übermittelt.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # IDs validieren
        try:
            for entry in profile_mapping:
                int(entry.get('victimProfileId'))
        except (ValueError, TypeError):
            return Response({'error': 'Ungültige Profile-IDs enthalten.'}, status=status.HTTP_400_BAD_REQUEST)

        observer_account_data = request.data.get('observer_account')
        if not observer_account_data:
            return Response({'error': 'observer_account-Daten fehlen.'}, status=status.HTTP_400_BAD_REQUEST)

        class DummyObserverAccount:
            def __init__(self, first_name, last_name, email):
                self.first_name = first_name
                self.last_name = last_name
                self.email = email

        observer_account = DummyObserverAccount(
            first_name=observer_account_data.get('first_name', 'Unbekannt'),
            last_name=observer_account_data.get('last_name', ''),
            email=observer_account_data.get('email', 'unknown@observer')
        )

        def dval(x):
            """
            Hilfsfunktion, um sicherzustellen, dass Werte als gültige Strings zurückgegeben werden.
            """
            try:
                s = str(x).strip()
                return s if s else ""
            except:
                return ""

        profiles_for_email = []
        created_responses = []

        try:
            victim_profile_ids = [entry.get('victimProfileId') for entry in profile_mapping]
            all_victim_profiles = list(VictimProfile.objects.filter(id__in=victim_profile_ids))
            profile_dict = {str(vp.id): vp for vp in all_victim_profiles}

            if not all_victim_profiles:
                return Response({
                    'error': 'Zu den übermittelten IDs wurden keine VictimProfiles gefunden.',
                    'requested_ids': victim_profile_ids
                }, status=status.HTTP_404_NOT_FOUND)

            print(f"[INFO] Speichere {len(profile_mapping)} Profile für {observer_account.first_name} {observer_account.last_name}")

            with transaction.atomic():
                for idx, entry in enumerate(profile_mapping):
                    victim_profile_id = entry.get('victimProfileId')
                    button_number = entry.get('buttonNumber', '')
                    vp = profile_dict.get(str(victim_profile_id))

                    if not vp:
                        print(f"[WARNING] Profil mit ID {victim_profile_id} nicht gefunden, überspringe.")
                        continue

                    print(f"[DEBUG] Verarbeite Profil: {victim_profile_id}, Button: {button_number}")

                    # ob wir passendes profile_data haben
                    complete_profile = None
                    if profile_data and idx < len(profile_data):
                        complete_profile = profile_data[idx]

                    if complete_profile:
                        diagnostic_loaded = complete_profile.get('diagnostic_loaded', {})
                        if not diagnostic_loaded:
                            diagnostic_loaded = {
                                "diagnosis": dval(vp.diagnosis),
                                "visual": dval(vp.visual_diagnosis),
                                "findings": dval(vp.findings),
                                "symptoms": dval(vp.symptoms),
                            }
                            
                        vitalwerte = complete_profile.get('vitalwerte', {})
                        if not vitalwerte:
                            vitalwerte = {
                                "gcs": dval(vp.gcs),
                                "spo2": dval(vp.spo2),
                                "rekap": dval(vp.rekap),
                                "resp_rate": dval(vp.resp_rate),
                                "sys_rr": dval(vp.sys_rr),
                                "ekg": dval(vp.ekg_monitor),
                                "hb": dval(vp.hb_value),
                            }
                        
                        resp_obj = VictimProfileResponse.objects.create(
                            button_number=button_number,
                            kh_intern=complete_profile.get('kh_intern', ''),
                            soll_sichtung=dval(vp.category),
                            diagnostic_loaded=diagnostic_loaded,
                            vitalwerte=vitalwerte,
                            ist_sichtung=complete_profile.get('ist_sichtung', ''),
                            sichtung_data=complete_profile.get('sichtung_data', []),
                            diagnostik_data=complete_profile.get('diagnostik_data', []),
                            therapie_data=complete_profile.get('therapie_data', []),
                            op_team=complete_profile.get('op_team', []),
                            verlauf=complete_profile.get('verlaufseintraege', []),
                            observer_name=complete_profile.get('observer_name', dval(f"{observer_account.first_name} {observer_account.last_name}".strip())),
                            observer_email=complete_profile.get('observer_email', dval(observer_account.email)),
                        )
                        created_responses.append(resp_obj)
                    else:
                        # fallback
                        resp_obj = VictimProfileResponse.objects.create(
                            button_number=button_number,
                            kh_intern="",
                            soll_sichtung=dval(vp.category),
                            diagnostic_loaded={
                                "diagnosis": dval(vp.diagnosis),
                                "visual": dval(vp.visual_diagnosis),
                                "findings": dval(vp.findings),
                                "symptoms": dval(vp.symptoms),
                            },
                            vitalwerte={
                                "gcs": dval(vp.gcs),
                                "spo2": dval(vp.spo2),
                                "rekap": dval(vp.rekap),
                                "resp_rate": dval(vp.resp_rate),
                                "sys_rr": dval(vp.sys_rr),
                                "ekg": dval(vp.ekg_monitor),
                                "hb": dval(vp.hb_value),
                            },
                            ist_sichtung="",
                            sichtung_data={
                                "pcz_ivena": dval(vp.pcz_ivena),
                                "expected_med_action": dval(vp.expected_med_action),
                            },
                            diagnostik_data={
                                "ro_thorax": dval(vp.ro_thorax),
                                "fast_sono": dval(vp.fast_sono),
                                "e_fast": dval(vp.e_fast),
                                "radiology_finds": dval(vp.radiology_finds),
                            },
                            therapie_data={
                                "emergency_op": dval(vp.emergency_op),
                                "op_sieve_special": dval(vp.op_sieve_special),
                                "op_sieve_basic": dval(vp.op_sieve_basic),
                                "personal_resources": dval(vp.personal_resources),
                                "anesthesia_team": dval(vp.anesthesia_team),
                                "radiology_resources": dval(vp.radiology_resources),
                                "op_achi_res": dval(vp.op_achi_res),
                                "op_uchi_res": dval(vp.op_uchi_res),
                                "op_nchi_res": dval(vp.op_nchi_res),
                            },
                            op_team=[],
                            verlauf=[],
                            observer_name=dval(f"{observer_account.first_name} {observer_account.last_name}".strip()),
                            observer_email=dval(observer_account.email),
                        )
                        created_responses.append(resp_obj)

                    # E-Mail-Versand: Klon anlegen
                    cloned_vp = copy.copy(vp)
                    setattr(cloned_vp, '_button_number', button_number)
                    profiles_for_email.append(cloned_vp)

            # E-Mail
            email_success = False
            email_error = None

            if profiles_for_email:
                try:
                    if observer_account.email and observer_account.email != "unknown@observer":
                        print(f"[DEBUG] Starte E-Mail-Versand an {observer_account.email} für {len(profiles_for_email)} Profile")
                        print(f"[DEBUG] SMTP-Konfiguration: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, TLS={settings.EMAIL_USE_TLS}")

                        send_victimprofiles_email(observer_account, profiles_for_email, profile_data)

                        print(f"[INFO] E-Mail für {len(profiles_for_email)} Profile an {observer_account.email} gesendet")
                        email_success = True
                    else:
                        print(f"[INFO] Keine E-Mail gesendet, da ungültige E-Mail-Adresse: {observer_account.email}")
                        email_error = "Ungültige E-Mail-Adresse"
                except Exception as e:
                    import traceback
                    email_error = str(e)
                    error_details = traceback.format_exc()
                    print(f"[ERROR] E-Mail konnte nicht gesendet werden: {email_error}")
                    print(f"[ERROR] Details: {error_details}")

            return Response({
                'message': 'VictimProfiles wurden erfolgreich gespeichert.',
                'profiles_count': len(created_responses),
                'email_to': observer_account.email,
                'email_success': email_success,
                'email_error': email_error,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            error_details = str(e)
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                error_details += f" - Server-Antwort: {e.response.text}"
            
            print(f"[ERROR] Fehler beim Senden der VictimProfileResponse: {error_details}")
            print(traceback.format_exc())
            
            return Response({
                'error': f'Fehler beim Senden der VictimProfile Response: {str(e)}',
                'detail': error_details if settings.DEBUG else 'Weitere Details im Server-Log'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -------------------------------
# 9) VICTIMPROFILERESPONSE-VIEWSET
# -------------------------------

class VictimProfileResponseViewSet(viewsets.ModelViewSet):
    """
    ViewSet für die Verwaltung von Opferprofil-Antworten.
    Ermöglicht CRUD-Operationen auf VictimProfileResponse-Objekte.
    """
    queryset = VictimProfileResponse.objects.all()
    serializer_class = VictimProfileResponseSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Überschreibt die Standarderstellungsmethode für die Validierung
        und Speicherung der Daten.
        """
        # Validierung und Speicherung der Daten
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        victim_response = serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)