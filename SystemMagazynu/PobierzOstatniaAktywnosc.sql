
CREATE OR ALTER FUNCTION dbo.PobierzOstatniaAktywnosc
(
    @LiczbaRekordow INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        d.Typ,
        d.NumerDokumentu AS Numer,
        CASE
            WHEN d.Typ = 'PZ' THEN
                'Przyj�cie od ' + ISNULL(ds.Nazwa, '') + ' (' + CAST((SELECT SUM(Ilosc) FROM PozycjeDokumentow WHERE DokumentId = d.IdDokumentu) AS VARCHAR) + ' szt.)'
            WHEN d.Typ = 'WZ' THEN
                'Wydanie do ' + ISNULL(od.Nazwa, '') + ' (' + CAST((SELECT SUM(Ilosc) FROM PozycjeDokumentow WHERE DokumentId = d.IdDokumentu) AS VARCHAR) + ' szt.)'
            ELSE d.Typ + ' - ' + d.NumerDokumentu
        END AS Opis,
        d.Data AS Czas
    FROM Dokumenty d
    LEFT JOIN Dostawcy ds ON d.DostawcaId = ds.IdDostawcy
    LEFT JOIN Odbiorcy od ON d.OdbiorcaId = od.IdOdbiorcy
    ORDER BY d.Data DESC
    OFFSET 0 ROWS FETCH NEXT @LiczbaRekordow ROWS ONLY
);