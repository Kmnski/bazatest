namespace SystemMagazynu.Models;

public class PozycjaDokumentu
{
	public int IdPozycji { get; set; }
	public decimal Ilosc { get; set; }

	// Klucze obce
	public int DokumentId { get; set; }
	public Dokument Dokument { get; set; } = null!;

	public int MaterialId { get; set; }
	public Material Material { get; set; } = null!;
}