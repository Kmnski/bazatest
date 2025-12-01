using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.DTOs;
using SystemMagazynu.Models;
using SystemMagazynu.Services;
using Microsoft.AspNetCore.Authorization;

namespace SystemMagazynu.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly MagazynDbContext _context;
    private readonly TokenService _tokenService;

    public AuthController(MagazynDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    // POST: api/Auth/register
    [HttpPost("register")]
    public async Task<ActionResult<UserResponseDto>> Register(RegisterDto registerDto)
    {
        
        if (await _context.Uzytkownicy.AnyAsync(u => u.Email == registerDto.Email))
        {
            return BadRequest("U¿ytkownik z tym emailem ju¿ istnieje");
        }

        
        Rola? rola = null;

        
        if (!await _context.Uzytkownicy.AnyAsync())
        {
            rola = Rola.Admin;
        }

        // Stwórz nowego u¿ytkownika
        var user = new Uzytkownik
        {
            Email = registerDto.Email,
            HasloHash = PasswordHasher.HashPassword(registerDto.Haslo),
            Imie = registerDto.Imie,
            Nazwisko = registerDto.Nazwisko,
            Rola = rola,
            DataRejestracji = DateTime.Now,
            CzyAktywny = true
        };

        _context.Uzytkownicy.Add(user);
        await _context.SaveChangesAsync();

        // Generuj token
        var token = _tokenService.CreateToken(user);

        // Zwróæ odpowiedŸ
        return new UserResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            Imie = user.Imie,
            Nazwisko = user.Nazwisko,
            Rola = user.Rola?.ToString() ?? "",
            Token = token
        };
    }

    // POST: api/Auth/login
    [HttpPost("login")]
    public async Task<ActionResult<UserResponseDto>> Login(LoginDto loginDto)
    {
        // ZnajdŸ u¿ytkownika
        var user = await _context.Uzytkownicy
            .FirstOrDefaultAsync(u => u.Email == loginDto.Email && u.CzyAktywny);

        if (user == null || !PasswordHasher.VerifyPassword(loginDto.Haslo, user.HasloHash))
        {
            return Unauthorized("Nieprawid³owy email lub has³o");
        }

        // Generuj token
        var token = _tokenService.CreateToken(user);

        // Zwróæ odpowiedŸ
        return new UserResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            Imie = user.Imie,
            Nazwisko = user.Nazwisko,
            Rola = user.Rola?.ToString() ?? "",
            Token = token
        };
    }

    // POST: api/Auth/logout
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Wylogowano"});
    }

    // POST: api/Auth/DodajRole
    [HttpPost("DodajRole")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DodajRole([FromBody] DodajRoleDto dodajRoleDto)
    {
        if (dodajRoleDto == null)
            return BadRequest("Dane s¹ wymagane");

        if (dodajRoleDto.UserId <= 0)
            return BadRequest("Nieprawid³owe ID u¿ytkownika");

        var user = await _context.Uzytkownicy.FindAsync(dodajRoleDto.UserId);

        if (user == null)
            return NotFound("U¿ytkownik nie istnieje");

        user.Rola = dodajRoleDto.Rola;
        await _context.SaveChangesAsync();

        string rolaDisplay = dodajRoleDto.Rola == Rola.Brak ? "Brak" : dodajRoleDto.Rola.ToString();
        return Ok(new { message = $"Przydzielono rolê {rolaDisplay} dla {user.Email}" });
    }

    // GET: api/Auth/AllUsers
    [HttpGet("AllUsers")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetAllUsers()
    {
        var users = await _context.Uzytkownicy

            .Select(u => new { u.Id, u.Email, u.Imie, u.Nazwisko, u.Rola })
            .ToListAsync();

        return Ok(users);
    }

}