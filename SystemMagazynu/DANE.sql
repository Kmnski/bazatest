SET IDENTITY_INSERT Uzytkownicy ON;

INSERT INTO Uzytkownicy (Id, Email, HasloHash, Rola, Imie, Nazwisko, DataRejestracji, CzyAktywny)
VALUES (1, 'admin@magazyn.pl', 'sX4eBFDaxCXqMYJT9vhSly1pcx1sdJnAAUaLaVttohk=', 'Admin', 'Jan', 'Kowalski', '2024-01-01', 1);

SET IDENTITY_INSERT Uzytkownicy OFF;



-- 2. DOSTAWCY
SET IDENTITY_INSERT Dostawcy ON;

INSERT INTO Dostawcy (IdDostawcy, Nazwa, Email, Telefon, CzyAktywny) VALUES
(1, 'TechMaterial Import-Export', 'biuro@techmaterial.pl', '+48619876543', 1),
(2, 'Global Supplies International', 'orders@globalsupplies.com', '+493012345678', 1),
(3, 'MetalExpert S.A.', 'sprzedaz@metalexpert.pl', '+48715554433', 1),
(4, 'ElektroKomponent', 'info@elektrokomponent.com.pl', '+48123456789', 1),
(5, 'ChemiaPrzemysłowa Sp. z o.o.', 'sklep@chemiaprzemyslowa.pl', '+48324445566', 1),
(6, 'Drewnex - Materiały Drewniane', 'kontakt@drewnex.pl', '+48187778899', 1),
(7, 'StalMax Hurtownia Stali', 'zamowienia@stalmax.pl', '+48332223344', 1),
(8, 'Narzędzia Precyzyjne TECH', 'biuro@narzedziatech.pl', '+48426667788', 1),
(9, 'PlastikPol - Tworzywa Sztuczne', 'sprzedaz@plastikpol.com', '+48589990011', 1);

SET IDENTITY_INSERT Dostawcy OFF;



-- 3. ODBIORCY
SET IDENTITY_INSERT Odbiorcy ON;

INSERT INTO Odbiorcy (IdOdbiorcy, Nazwa, Email, Telefon, Adres, CzyAktywny) VALUES
(1, 'Firma Budowlana "Konstruktor"', 'zamowienia@konstruktor.pl', '+48 22 111 22 33', 'Warszawa, ul. Budowlana 15', 1),
(2, 'Zakład Produkcyjny "MetalTech"', 'hurt@metaltech.com.pl', '+48 61 444 55 66', 'Poznań, ul. Przemysłowa 8', 1),
(3, 'Sklep Elektryczny "ElektroMax"', 'sklep@elektromax.pl', '+48 12 777 88 99', 'Kraków, ul. Elektryków 22', 1),
(4, 'Warsztat Samochodowy "AutoSerwis"', 'biuro@autoserwis.krakow.pl', '+48 71 333 44 55', 'Wrocław, ul. Mechaniczna 5', 1),
(5, 'Firma Remontowa "Renowacja"', 'kontakt@renowacja.gdansk.pl', '+48 58 666 77 88', 'Gdańsk, ul. Remontowa 12', 1);

SET IDENTITY_INSERT Odbiorcy OFF;



-- 4. MAGAZYNY
SET IDENTITY_INSERT Magazyny ON;

INSERT INTO Magazyny (IdMagazynu, Lokalizacja, Typ) VALUES
(1, 'Warszawa, ul. Centralna 15', 'Główny'),
(2, 'Kraków, ul. Magazynowa 8', 'Regionalny'),
(3, 'Wrocław, al. Przemysłowa 22', 'Regionalny'),
(4, 'Gdańsk, ul. Portowa 5', 'Portowy'),
(5, 'Poznań, ul. Dystrybucyjna 12', 'Regionalny'),
(6, 'Katowice, ul. Hutnicza 30', 'Regionalny');

SET IDENTITY_INSERT Magazyny OFF;



-- 5. MATERIAŁY
SET IDENTITY_INSERT Materialy ON;

INSERT INTO Materialy (IdMaterialu, Nazwa, Opis, Jednostka) VALUES
(1, 'Blacha stalowa 2mm', 'Blacha stalowa o grubości 2mm, gatunek ST3S', 'szt'),
(2, 'Śruba M6x20', 'Śruba stalowa ocynkowana, klasa wytrzymałości 8.8', 'szt'),
(3, 'Farba emulsyjna biała', 'Farba emulsyjna biała, pojemność 10L', 'szt'),
(4, 'Płyta OSB 18mm', 'Płyta OSB 18mm, wymiar 2500x1250mm', 'szt'),
(5, 'Łożysko kulkowe 6205', 'Łożysko kulkowe 6205, wymiary 25x52x15mm', 'szt'),
(6, 'Karton fala E', 'Karton fala E, wymiar 400x300x200mm', 'szt'),
(7, 'Klej montażowy', 'Klej montażowy w piance, pojemność 750ml', 'szt'),
(8, 'Wkręt do drewna 4,5x50', 'Wkręt do drewna, żółty ocynkowany', 'szt'),
(9, 'Rura PVC 50mm', 'Rura kanalizacyjna PVC, średnica 50mm, długość 2m', 'szt'),
(10, 'Blacha stalowa 1mm', 'Blacha stalowa o grubości 1mm, gatunek ST', 'szt');

SET IDENTITY_INSERT Materialy OFF;



-- 6. DOKUMENTY
SET IDENTITY_INSERT Dokumenty ON;

INSERT INTO Dokumenty (IdDokumentu, Typ, Data, Status, NumerDokumentu, DostawcaId, OdbiorcaId, MagazynId, UzytkownikId) VALUES 
(1, 'PZ', '2024-01-15', 'zatwierdzony', 'PZ/2024/001', 1, NULL, 1, 1),
(2, 'WZ', '2024-01-16', 'zatwierdzony', 'WZ/2024/001', NULL, 1, 1, 1),
(3, 'PZ', '2024-01-17', 'zatwierdzony', 'PZ/2024/002', 2, NULL, 2, 1),
(4, 'WZ', '2024-01-18', 'zatwierdzony', 'WZ/2024/002', NULL, 2, 2, 1),
(5, 'PZ', '2024-01-19', 'oczekujacy', 'PZ/2024/003', 3, NULL, 3, 1),
(6, 'WZ', '2024-01-20', 'zatwierdzony', 'WZ/2024/003', NULL, 3, 3, 1);

SET IDENTITY_INSERT Dokumenty OFF;



-- 7. POZYCJE DOKUMENTÓW
SET IDENTITY_INSERT PozycjeDokumentow ON;

INSERT INTO PozycjeDokumentow (IdPozycji, Ilosc, DokumentId, MaterialId) VALUES 
(1, 100, 1, 1),
(2, 50, 1, 2),
(3, 200, 2, 3),
(4, 30, 2, 4),
(5, 75, 3, 5),
(6, 25, 3, 6),
(7, 150, 4, 7),
(8, 40, 4, 8),
(9, 80, 5, 9),
(10, 60, 6, 10);

SET IDENTITY_INSERT PozycjeDokumentow OFF;



-- 8. STANY MAGAZYNOWE
INSERT INTO StanyMagazynowe (Ilosc, MagazynId, MaterialId) VALUES
(500, 1, 1),
(300, 1, 2),
(200, 1, 3),
(150, 2, 4),
(100, 2, 5),
(250, 3, 6),
(180, 3, 7),
(120, 4, 8),
(90, 5, 9),
(160, 6, 10);
