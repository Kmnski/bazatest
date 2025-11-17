using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using SystemMagazynu.Models;

public class RezerwacjaMaterialu
{
	public int IdRezerwacji { get; set; }
	public int MaterialId { get; set; }
	public int MagazynId { get; set; }
	public int DokumentId { get; set; }
	public decimal ZarezerwowanaIlosc { get; set; }
	public DateTime DataRezerwacji { get; set; }
	public string Status { get; set; }

	// Relacje
	public Material Material { get; set; }
	public Magazyn Magazyn { get; set; }
	public Dokument Dokument { get; set; }
}