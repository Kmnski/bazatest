using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SystemMagazynu.Controllers;
using SystemMagazynu.Data;
using SystemMagazynu.DTOs;
using SystemMagazynu.Models;
using SystemMagazynu.Services;
using Xunit;

public class AuthControllerTests
{
    private MagazynDbContext GetDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<MagazynDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new MagazynDbContext(options);
    }

    private TokenService GetTokenService()
    {
        
        var inMemorySettings = new Dictionary<string, string>
        {
            {"Jwt:Key", "superdupersekretnyklucz1234567890!"}, // >= 32 znaki
            {"Jwt:Issuer", "TestIssuer"},
            {"Jwt:Audience", "TestAudience"}
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection((IEnumerable<KeyValuePair<string, string?>>)inMemorySettings)
            .Build();

        return new TokenService(configuration);
    }

    [Fact]
    public async Task Register_FirstUser_GetsAdminRole()
    {
        using var context = GetDbContext("Db_Register_FirstUser");
        var tokenService = GetTokenService();
        var controller = new AuthController(context, tokenService);

        var dto = new RegisterDto
        {
            Email = "admin@test.pl",
            Haslo = "Password123!",
            Imie = "Admin",
            Nazwisko = "User"
        };

        var result = await controller.Register(dto);
        var userResponse = Assert.IsType<UserResponseDto>(result.Value!);

        Assert.Equal("admin@test.pl", userResponse.Email);
        Assert.Equal("Admin", userResponse.Rola);
        Assert.NotNull(userResponse.Token);
    }

    [Fact]
    public async Task Login_ValidUser_ReturnsToken()
    {
        using var context = GetDbContext("Db_Login_Valid");
        var tokenService = GetTokenService();
        var controller = new AuthController(context, tokenService);

        // Dodaj u¿ytkownika rêcznie
        var user = new Uzytkownik
        {
            Email = "user@test.pl",
            HasloHash = PasswordHasher.HashPassword("Password123!"),
            Imie = "Test",
            Nazwisko = "User",
            CzyAktywny = true
        };
        context.Uzytkownicy.Add(user);
        await context.SaveChangesAsync();

        var loginDto = new LoginDto
        {
            Email = "user@test.pl",
            Haslo = "Password123!"
        };

        var result = await controller.Login(loginDto);
        var userResponse = Assert.IsType<UserResponseDto>(result.Value!);

        Assert.Equal("user@test.pl", userResponse.Email);
        Assert.NotNull(userResponse.Token);
    }
}
