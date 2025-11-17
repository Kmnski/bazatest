namespace SystemMagazynu.Models;

public class Magazyn
{
    public int IdMagazynu { get; set; }
    public string Lokalizacja { get; set; } = string.Empty;
    public string Typ { get; set; } = string.Empty;

    // Relacje
    public ICollection<StanMagazynowy> StanyMagazynowe { get; set; } = new List<StanMagazynowy>();
    public ICollection<Dokument> Dokumenty { get; set; } = new List<Dokument>();
}