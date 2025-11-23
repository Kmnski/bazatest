using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Microsoft.AspNetCore.Authorization;
using SystemMagazynu.Services;

namespace SystemMagazynu.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MaterialyController : ControllerBase
{
    private readonly MagazynDbContext _context;

    public MaterialyController(MagazynDbContext context)
    {
        _context = context;
    }

    // GET: api/Materialy
    [HttpGet]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<Material>>> GetMaterialy()
    {
        return await _context.Materialy.ToListAsync();
    }

    // GET: api/Materialy/5
    [Authorize(Roles = "Admin,Magazynier")]
    [HttpGet("{id}")]
    public async Task<ActionResult<Material>> GetMaterial(int id)
    {
        var material = await _context.Materialy.FindAsync(id);

        if (material == null)
        {
            return NotFound();
        }

        return material;
    }

    // POST: api/Materialy
    [HttpPost]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<Material>> PostMaterial(Material material)
    {
        // 1. WALIDACJA
        if (string.IsNullOrWhiteSpace(material.Nazwa))
            return BadRequest("Nazwa materia³u jest wymagana");

        if (string.IsNullOrWhiteSpace(material.Jednostka))
            return BadRequest("Jednostka materia³u jest wymagana");

        try
        {
            // 2. ZAPIS
            _context.Materialy.Add(material);
            await _context.SaveChangesAsync();

            // 3. LOG
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(MaterialyController),
                nameof(PostMaterial),
                $"Dodano materia³ {material.Nazwa} (ID: {material.IdMaterialu})");

            return CreatedAtAction(nameof(GetMaterial),
                new { id = material.IdMaterialu }, material);
        }
        catch (Exception ex)
        {
            // 4. LOGOWANIE B£ÊDU
            await LoggerService.ZapiszB³adAsync(_context,
                nameof(MaterialyController),
                nameof(PostMaterial),
                ex);

            return StatusCode(500, "B³¹d serwera podczas dodawania materia³u.");
        }
    }


}