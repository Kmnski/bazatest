CREATE OR ALTER PROCEDURE sp_SearchOdbiorcy
    @SearchQuery NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SearchTerm NVARCHAR(102) = '%' + @SearchQuery + '%';

    SELECT
        IdOdbiorcy,
        Nazwa,
        Email,
        Telefon,
        Adres,
        CzyAktywny
    FROM Odbiorcy
    WHERE
        (Nazwa LIKE @SearchTerm
        OR Email LIKE @SearchTerm
        OR Telefon LIKE @SearchTerm
        OR Adres LIKE @SearchTerm)
        AND CzyAktywny = 1
    ORDER BY Nazwa
END