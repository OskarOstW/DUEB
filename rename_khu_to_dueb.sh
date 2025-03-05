# admin_excelupload.py
sed -i 's/KHU-App/DÜB-App/g' ./DUEB_backend/DUEBapp/admin_excelupload.py

# email_and_excel_victimprofiles.py
sed -i 's/KHU-Übung/DÜB-Übung/g' ./DUEB_backend/DUEBapp/email_and_excel_victimprofiles.py
sed -i 's/Ihr KHU-Team/Ihr DÜB-Team/g' ./DUEB_backend/DUEBapp/email_and_excel_victimprofiles.py

# settings.py
sed -i 's/KHU-Backend-Projekt/DÜB-Backend-Projekt/g' ./DUEB_backend/DUEB_backend_Projekt/settings.py
sed -i 's/Digitale Übungsbeobachtung (KHU)/Digitale Übungsbeobachtung (DÜB)/g' ./DUEB_backend/DUEB_backend_Projekt/settings.py
sed -i "s/\[KHU Projekt\]/\[DÜB Projekt\]/g" ./DUEB_backend/DUEB_backend_Projekt/settings.py