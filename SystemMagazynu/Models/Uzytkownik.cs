namespace SystemMagazynu.Models;



public class Uzytkownik
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string HasloHash { get; set; } = string.Empty;
    public Rola? Rola { get; set; }
    public string Imie { get; set; } = string.Empty;
    public string Nazwisko { get; set; } = string.Empty;
    public DateTime DataRejestracji { get; set; } = DateTime.Now;
    public bool CzyAktywny { get; set; } = true;

    // Relacje
    public ICollection<Dokument> Dokumenty { get; set; } = new List<Dokument>();
}