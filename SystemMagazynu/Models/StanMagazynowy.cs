namespace SystemMagazynu.Models;

public class StanMagazynowy
{
    public decimal Ilosc { get; set; }

    // Klucze z³o¿one
    public int MagazynId { get; set; }
    public Magazyn Magazyn { get; set; } = null!;

    public int MaterialId { get; set; }
    public Material Material { get; set; } = null!;
}