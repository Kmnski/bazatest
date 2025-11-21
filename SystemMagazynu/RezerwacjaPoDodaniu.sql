-- 3. Trigger po dodaniu rezerwacji (zmniejsza dostêpne iloœci w magazynie)
CREATE TRIGGER RezerwacjaPoDodaniu
ON RezerwacjeMaterialow
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Wstawienie rezerwacji - zmniejszamy dostêpne iloœci
    UPDATE sm
    SET sm.Ilosc = sm.Ilosc - i.ZarezerwowanaIlosc
    FROM StanyMagazynowe sm
    INNER JOIN inserted i ON sm.MagazynId = i.MagazynId AND sm.MaterialId = i.MaterialId;

   
    END