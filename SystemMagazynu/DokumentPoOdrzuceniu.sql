-- Trigger po odrzuceniu dokumentu, który przywraca magazyn i usuwa rezerwacje
CREATE TRIGGER DokumentPoOdrzuceniu
ON Dokumenty
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Dokumenty WZ, które zmieniły status na odrzucony
    -- Przywracamy ilości w magazynie przed usunięciem rezerwacji
    UPDATE sm
    SET sm.Ilosc = sm.Ilosc + rm.ZarezerwowanaIlosc
    FROM StanyMagazynowe sm
    INNER JOIN RezerwacjeMaterialow rm ON sm.MagazynId = rm.MagazynId AND sm.MaterialId = rm.MaterialId
    INNER JOIN inserted i ON rm.DokumentId = i.IdDokumentu
    INNER JOIN deleted d ON i.IdDokumentu = d.IdDokumentu
    WHERE i.Status = 'odrzucony' AND d.Status <> 'odrzucony' AND i.Typ = 'WZ';

    -- Usuwamy rezerwacje dla odrzuconego WZ
    DELETE rm
    FROM RezerwacjeMaterialow rm
    INNER JOIN inserted i ON rm.DokumentId = i.IdDokumentu
    INNER JOIN deleted d ON i.IdDokumentu = d.IdDokumentu
    WHERE i.Status = 'odrzucony' AND d.Status <> 'odrzucony' AND i.Typ = 'WZ';
END
