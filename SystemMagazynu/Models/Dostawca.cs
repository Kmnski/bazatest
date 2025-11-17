namespace SystemMagazynu.Models;

public class Dostawca
{
    public int IdDostawcy { get; set; }
    public string Nazwa { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefon { get; set; }
    public bool CzyAktywny { get; set; } = true;

    // Relacje
    public ICollection<Dokument> Dokumenty { get; set; } = new List<Dokument>();
}