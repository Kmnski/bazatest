CREATE OR ALTER FUNCTION PobierzStatystykiMaterialow()
RETURNS TABLE
AS
RETURN
(
    SELECT 
        m.Nazwa,
        SUM(sm.Ilosc) AS LacznyStan,
        COUNT(DISTINCT sm.MagazynId) AS LiczbaMagazynow,
        (SELECT COUNT(*) FROM PozycjeDokumentow pd 
         JOIN Dokumenty d ON pd.DokumentId = d.IdDokumentu 
         WHERE pd.MaterialId = m.IdMaterialu AND d.Typ = 'WZ' AND MONTH(d.Data) = MONTH(GETDATE()))
        AS WydaniaWMiesiacu
    FROM Materialy m
    LEFT JOIN StanyMagazynowe sm ON m.IdMaterialu = sm.MaterialId
    GROUP BY m.IdMaterialu, m.Nazwa
);