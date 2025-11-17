namespace SystemMagazynu.Models;

public class LogBledu
{
    public int Id { get; set; }
    public DateTime Data { get; set; } = DateTime.Now;
    public string? Kontroler { get; set; }
    public string? Akcja { get; set; }
    public string? Komunikat { get; set; }
    public string? StackTrace { get; set; }
}