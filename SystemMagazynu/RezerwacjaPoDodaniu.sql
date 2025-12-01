-- 3. Trigger po dodaniu rezerwacji (zmniejsza dostępne ilości w magazynie)
CREATE TRIGGER RezerwacjaPoDodaniu
ON RezerwacjeMaterialow
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Wstawienie rezerwacji - zmniejszamy dostępne ilości
    UPDATE sm
    SET sm.Ilosc = sm.Ilosc - i.ZarezerwowanaIlosc
    FROM StanyMagazynowe sm
    INNER JOIN inserted i ON sm.MagazynId = i.MagazynId AND sm.MaterialId = i.MaterialId;

   
    END