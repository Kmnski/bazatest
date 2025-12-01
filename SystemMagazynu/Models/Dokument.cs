namespace SystemMagazynu.Models;

public class Dokument
{
    public int IdDokumentu { get; set; }
    public string Typ { get; set; } = string.Empty;
    public DateTime Data { get; set; } = DateTime.Now;
    public string Status { get; set; } = string.Empty;
    public string NumerDokumentu { get; set; } = string.Empty;

    
    public int? DostawcaId { get; set; }
    public Dostawca? Dostawca { get; set; }

    public int? OdbiorcaId { get; set; }
    public Odbiorca? Odbiorca { get; set; }

    public int MagazynId { get; set; }
    public Magazyn Magazyn { get; set; } = null!;

 
    public int UzytkownikId { get; set; }
    public Uzytkownik Uzytkownik { get; set; } = null!;

    // Relacje
    public ICollection<PozycjaDokumentu> Pozycje { get; set; } = new List<PozycjaDokumentu>();
}