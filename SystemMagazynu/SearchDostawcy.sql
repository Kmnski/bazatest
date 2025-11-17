
CREATE OR ALTER PROCEDURE sp_SearchDostawcy
    @SearchQuery NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SearchTerm NVARCHAR(102) = '%' + @SearchQuery + '%';

    SELECT 
        IdDostawcy,
        Nazwa,
        Email,
        Telefon,
        CzyAktywny
    FROM Dostawcy
    WHERE 
        (Nazwa LIKE @SearchTerm
        OR Email LIKE @SearchTerm
        OR Telefon LIKE @SearchTerm)
        AND CzyAktywny = 1
    ORDER BY Nazwa
END
