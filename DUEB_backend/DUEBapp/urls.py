# urls.py - URL-Konfiguration für die DÜB-Anwendung
# Diese Datei definiert die URL-Routen, über die auf die API-Endpunkte
# der DÜB-Anwendung (Digitale Übungsbeobachtung) zugegriffen werden kann.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FormViewSet,
    QuestionViewSet,
    OptionViewSet,
    FormResponseViewSet,
    ContactViewSet,
    HomeScreenImageViewSet,
    VictimProfileViewSet,
    ExcelUploadViewSet,
    OrganizationViewSet,
    TestScenarioViewSet,
    TestScenarioVictimViewSet,
    CustomAuthToken,
    ObserverAccountViewSet,
    SendVictimProfilesView,  # bereits vorhanden
    VictimProfileResponseViewSet  # NEUER View zum Speichern aller VictimProfileDetailScreen-Daten
)

# -------------------------------
# 1) ROUTER-KONFIGURATION
# -------------------------------

# DefaultRouter für Standardressourcen konfigurieren
router = DefaultRouter()
router.register(r'forms', FormViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'options', OptionViewSet)
router.register(r'form-responses', FormResponseViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'images', HomeScreenImageViewSet)
router.register(r'victim-profiles', VictimProfileViewSet)
router.register(r'excel-uploads', ExcelUploadViewSet)
router.register(r'organizations', OrganizationViewSet)
router.register(r'test-scenarios', TestScenarioViewSet)
router.register(r'test-scenario-victims', TestScenarioVictimViewSet)
router.register(r'observer-accounts', ObserverAccountViewSet)
router.register(r'victim-profile-responses', VictimProfileResponseViewSet)  # Neuer Endpunkt

# -------------------------------
# 2) URL-PFADE
# -------------------------------

urlpatterns = [
    # Endpunkt für Token-Authentifizierung (Online-Login)
    path('api-token-auth/', CustomAuthToken.as_view(), name='api-token-auth'),
    
    # Neuer Endpunkt zum Senden der VictimProfileResponse-Daten per E-Mail (wie bisher)
    path('send-victimprofiles/', SendVictimProfilesView.as_view(), name='send-victimprofiles'),
    
    # Einbindung aller durch den Router generierten URLs
    path('', include(router.urls)),
]