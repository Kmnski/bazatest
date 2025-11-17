
CREATE FUNCTION dbo.PobierzStatystykiDashboard
(
    @DataDzisiaj DATE
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        (SELECT COUNT(*) FROM Materialy) AS LiczbaMaterialow,
        (SELECT COUNT(*) FROM Dokumenty WHERE CAST(Data AS DATE) = @DataDzisiaj) AS DzisiejszeDokumenty,
        (SELECT COUNT(*) FROM Dostawcy WHERE CzyAktywny = 1) AS AktywniDostawcy,
        (SELECT COUNT(*) FROM Magazyny) AS LiczbaMagazynow
);