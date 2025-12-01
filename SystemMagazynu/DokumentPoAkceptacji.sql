-- 1. Trigger po zatwierdzeniu dokumentu
CREATE TRIGGER DokumentPoAkceptacji
ON Dokumenty
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;


    WITH Zatwierdzone AS (
        SELECT i.IdDokumentu, i.Typ, i.MagazynId
        FROM inserted i
        INNER JOIN deleted d ON i.IdDokumentu = d.IdDokumentu
        WHERE i.Status = 'zatwierdzony' AND d.Status <> 'zatwierdzony'
    )
     -- PZ - dodajemy do magazynu
   MERGE StanyMagazynowe AS target
    USING (
        SELECT i.MagazynId, p.MaterialId, p.Ilosc
        FROM inserted i
        INNER JOIN deleted d ON i.IdDokumentu = d.IdDokumentu
        INNER JOIN PozycjeDokumentow p ON p.DokumentId = i.IdDokumentu
        WHERE i.Status = 'zatwierdzony' AND d.Status <> 'zatwierdzony' AND i.Typ = 'PZ'
    ) AS source (MagazynId, MaterialId, Ilosc)
    ON target.MagazynId = source.MagazynId AND target.MaterialId = source.MaterialId
    WHEN MATCHED THEN
        UPDATE SET target.Ilosc = target.Ilosc + source.Ilosc
    WHEN NOT MATCHED THEN
        INSERT (MagazynId, MaterialId, Ilosc)
        VALUES (source.MagazynId, source.MaterialId, source.Ilosc);

     -- WZ - usuwamy powiązane rezerwacje
    WITH Zatwierdzone AS (
        SELECT i.IdDokumentu, i.Typ, i.MagazynId
        FROM inserted i
        INNER JOIN deleted d ON i.IdDokumentu = d.IdDokumentu
        WHERE i.Status = 'zatwierdzony' AND d.Status <> 'zatwierdzony'
    )
        DELETE rm
    FROM RezerwacjeMaterialow rm
    INNER JOIN Zatwierdzone z ON rm.DokumentId = z.IdDokumentu
    WHERE z.Typ = 'WZ';

END