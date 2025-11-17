CREATE TRIGGER DokumentPoOdrzuceniu 
ON Dokumenty  
AFTER UPDATE  
AS  
BEGIN     
    SET NOCOUNT ON;

    -- Dla dokument�w odrzuconych typu WZ - zwolnij rezerwacje
    IF UPDATE(Status)
    BEGIN
        UPDATE rm
        SET rm.Status = 'zwolniona'
        FROM RezerwacjeMaterialow rm
        INNER JOIN inserted i ON rm.DokumentId = i.IdDokumentu
        INNER JOIN deleted d ON i.IdDokumentu = d.IdDokumentu
        WHERE i.Status = 'odrzucony' 
          AND d.Status != 'odrzucony'
          AND i.Typ = 'WZ'
          AND rm.Status = 'aktywna';
    END
END