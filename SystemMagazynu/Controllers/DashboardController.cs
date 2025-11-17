using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.DTOs;
using SystemMagazynu.Models;
using Microsoft.AspNetCore.Authorization;

namespace SystemMagazynu.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly MagazynDbContext _context;

    public DashboardController(MagazynDbContext context)
    {
        _context = context;
    }

    // GET: api/Dashboard/statystyki
    [HttpGet("statystyki")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<DashboardStatystykiDto>> GetStatystyki()
    {
        var dzisiaj = DateTime.Today;

        var statystyki = await _context.Database
            .SqlQueryRaw<DashboardStatystykiDto>("SELECT * FROM dbo.PobierzStatystykiDashboard({0})", dzisiaj)
            .FirstOrDefaultAsync();

        return Ok(statystyki);
    }

    // GET: api/Dashboard/ostatnia-aktywnosc
    [HttpGet("ostatnia-aktywnosc")]
    [Authorize(Roles = "Admin,Magazynier")]

    public async Task<ActionResult<List<OstatniaAktywnoscDto>>> GetOstatniaAktywnosc()
    {
        var aktywnosc = await _context.Database
            .SqlQueryRaw<OstatniaAktywnoscDto>("SELECT * FROM dbo.PobierzOstatniaAktywnosc(5)")
            .ToListAsync();

        return Ok(aktywnosc);
    }
}