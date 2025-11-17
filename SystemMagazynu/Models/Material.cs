namespace SystemMagazynu.Models;

public class Material
{
    public int IdMaterialu { get; set; }
    public string Nazwa { get; set; } = string.Empty;
    public string? Opis { get; set; }
    public string Jednostka { get; set; } = string.Empty;

    // Relacje
    public ICollection<PozycjaDokumentu> PozycjeDokumentow { get; set; } = new List<PozycjaDokumentu>();
    public ICollection<StanMagazynowy> StanyMagazynowe { get; set; } = new List<StanMagazynowy>();
}