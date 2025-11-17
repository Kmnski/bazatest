using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Microsoft.AspNetCore.Authorization;

namespace SystemMagazynu.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MagazynController : ControllerBase
{
    private readonly MagazynDbContext _context;

    public MagazynController(MagazynDbContext context)
    {
        _context = context;
    }

    // GET: api/Magazyn
    [HttpGet]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<Magazyn>>> GetMagazyny()
    {
        return await _context.Magazyny.ToListAsync();
    }

    // GET: api/Magazyn/5/materials
    [HttpGet("{id}/materials")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<object>>> GetMagazynMaterials(int id)
    {
        var magazyn = await _context.Magazyny.FindAsync(id);
        if (magazyn == null)
        {
            return NotFound();
        }

        // Pobierz materia³y dostêpne w tym magazynie ze stanami magazynowymi
        var materials = await _context.StanyMagazynowe
            .Where(sm => sm.MagazynId == id && sm.Ilosc > 0)
            .Include(sm => sm.Material)
            .Select(sm => new
            {
                idMaterialu = sm.Material.IdMaterialu,
                nazwa = sm.Material.Nazwa,
                jednostka = sm.Material.Jednostka,
                stanMagazynowy = sm.Ilosc
            })
            .ToListAsync();

        return materials;
    }
}