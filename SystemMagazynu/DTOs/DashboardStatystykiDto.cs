public class DashboardStatystykiDto
{
    public int LiczbaMaterialow { get; set; }
    public int DzisiejszeDokumenty { get; set; }
    public int AktywniDostawcy { get; set; }
    public int LiczbaMagazynow { get; set; }
}

public class OstatniaAktywnoscDto
{
    public string Typ { get; set; } = string.Empty;
    public string Numer { get; set; } = string.Empty;
    public string Opis { get; set; } = string.Empty;
    public DateTime Czas { get; set; }
}