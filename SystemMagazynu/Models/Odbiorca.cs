namespace SystemMagazynu.Models;

public class Odbiorca
{
	public int IdOdbiorcy { get; set; }
	public string Nazwa { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefon { get; set; } = string.Empty;
    public string Adres { get; set; } = string.Empty;
    public bool CzyAktywny { get; set; } = true;


    // Relacje
    public ICollection<Dokument> Dokumenty { get; set; } = new List<Dokument>();
}