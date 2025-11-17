CREATE TRIGGER DokumentPoAkceptacji  
ON Dokumenty  
AFTER UPDATE  
AS  
BEGIN     
    SET NOCOUNT ON;

    -- Sprawdzamy czy status zmieni� si� na "zatwierdzony"
    IF UPDATE(Status)
    BEGIN
        -- Dla dokument�w zatwierdzonych
        DECLARE @DokumentId INT, @Typ VARCHAR(10), @MagazynId INT;
                
        DECLARE dokument_cursor CURSOR FOR
        SELECT 
            inserted.IdDokumentu, 
            inserted.Typ, 
            inserted.MagazynId
        FROM inserted
        INNER JOIN deleted ON inserted.IdDokumentu = deleted.IdDokumentu
        WHERE inserted.Status = 'zatwierdzony' 
          AND deleted.Status != 'zatwierdzony';
                
        OPEN dokument_cursor;
        FETCH NEXT FROM dokument_cursor INTO @DokumentId, @Typ, @MagazynId;
                
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- DLA PZ (PRZYJ�CIE) - DODAJEMY MATERIA�Y DO MAGAZYNU
            IF @Typ = 'PZ'
            BEGIN
                -- Aktualizuj istniej�ce stany magazynowe
                UPDATE sm
                SET sm.Ilosc = sm.Ilosc + p.Ilosc
                FROM StanyMagazynowe sm
                INNER JOIN PozycjeDokumentow p ON sm.MaterialId = p.MaterialId 
                WHERE p.DokumentId = @DokumentId 
                  AND sm.MagazynId = @MagazynId;
                                
                -- Dla materia��w kt�re nie maj� jeszcze rekordu w StanyMagazynowe
                INSERT INTO StanyMagazynowe (MagazynId, MaterialId, Ilosc)
                SELECT 
                    @MagazynId, 
                    p.MaterialId, 
                    p.Ilosc
                FROM PozycjeDokumentow p
                WHERE p.DokumentId = @DokumentId
                  AND NOT EXISTS (
                      SELECT 1 
                      FROM StanyMagazynowe sm 
                      WHERE sm.MagazynId = @MagazynId 
                        AND sm.MaterialId = p.MaterialId
                  );
            END
                        
            -- DLA WZ (WYDANIE) - ODEJMUJEMY MATERIA�Y Z MAGAZYNU
            ELSE IF @Typ = 'WZ'
            BEGIN
                -- Aktualizuj stany magazynowe (odejmij ilo��)
                UPDATE sm
                SET sm.Ilosc = sm.Ilosc - p.Ilosc
                FROM StanyMagazynowe sm
                INNER JOIN PozycjeDokumentow p ON sm.MaterialId = p.MaterialId 
                WHERE p.DokumentId = @DokumentId 
                  AND sm.MagazynId = @MagazynId;
                                
                -- Oznacz rezerwacje jako zrealizowane
                UPDATE RezerwacjeMaterialow
                SET Status = 'zrealizowana'
                WHERE DokumentId = @DokumentId 
                  AND Status = 'aktywna';
            END
                        
            FETCH NEXT FROM dokument_cursor INTO @DokumentId, @Typ, @MagazynId;
        END
                
        CLOSE dokument_cursor;
        DEALLOCATE dokument_cursor;
    END
END