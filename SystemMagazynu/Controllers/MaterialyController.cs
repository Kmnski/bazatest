using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Microsoft.AspNetCore.Authorization;

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
        _context.Materialy.Add(material);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMaterial), new { id = material.IdMaterialu }, material);
    }

}