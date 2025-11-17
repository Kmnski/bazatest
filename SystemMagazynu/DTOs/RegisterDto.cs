namespace SystemMagazynu.DTOs;

public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Haslo { get; set; } = string.Empty;
    public string Imie { get; set; } = string.Empty;
    public string Nazwisko { get; set; } = string.Empty;
    public string Rola { get; set; } = "User"; // "Admin" lub "User"
}