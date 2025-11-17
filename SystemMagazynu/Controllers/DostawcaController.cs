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
public class DostawcaController : ControllerBase
{
    private readonly MagazynDbContext _context;

    public DostawcaController(MagazynDbContext context)
    {
        _context = context;
    }

    // GET: api/Dostawca - zwraca tylko aktywnych dostawców
    [HttpGet]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<Dostawca>>> GetDostawcy()
    {
        return await _context.Dostawcy
            .Where(d => d.CzyAktywny)
            .ToListAsync();
    }

    // GET: api/Dostawca/5
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<Dostawca>> GetDostawca(int id)
    {
        var dostawca = await _context.Dostawcy
            .Where(d => d.CzyAktywny)
            .FirstOrDefaultAsync(d => d.IdDostawcy == id);

        if (dostawca == null)
        {
            return NotFound();
        }

        return dostawca;
    }

    // POST: api/Dostawca
    [HttpPost]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<Dostawca>> PostDostawca(Dostawca dostawca)
    {
        // 1. WALIDACJA WEJŒCIA
        if (string.IsNullOrWhiteSpace(dostawca.Nazwa))
            return BadRequest("Nazwa dostawcy jest wymagana");
        if (string.IsNullOrWhiteSpace(dostawca.Email))
            return BadRequest("Email dostawcy jest wymagany");
        if (string.IsNullOrWhiteSpace(dostawca.Telefon))
            return BadRequest("Telefon dostawcy jest wymagany");

        try
        {
            // 2. ZAPIS
            dostawca.CzyAktywny = true;
            _context.Dostawcy.Add(dostawca);
            await _context.SaveChangesAsync();

            // 3. SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(DostawcaController),
                nameof(PostDostawca),
                $"Dodano dostawcê {dostawca.Nazwa} (ID: {dostawca.IdDostawcy})");

            return CreatedAtAction(nameof(GetDostawca), new { id = dostawca.IdDostawcy }, dostawca);
        }
        catch (Exception ex)
        {
            // 4. B£¥D – logujemy wyj¹tek
            await LoggerService.ZapiszB³adAsync(_context, nameof(DostawcaController), nameof(PostDostawca), ex);
            return StatusCode(500, "B³¹d serwera podczas dodawania dostawcy.");
        }
    }

    // PUT: api/Dostawca/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<IActionResult> PutDostawca(int id, Dostawca dostawca)
    {
        // 1. WALIDACJA WEJŒCIA
        if (id != dostawca.IdDostawcy)
            return BadRequest("ID w œcie¿ce nie zgadza siê z ID w obiekcie");

        if (string.IsNullOrWhiteSpace(dostawca.Nazwa))
            return BadRequest("Nazwa dostawcy jest wymagana");
        if (string.IsNullOrWhiteSpace(dostawca.Email))
            return BadRequest("Email dostawcy jest wymagany");
        if (string.IsNullOrWhiteSpace(dostawca.Telefon))
            return BadRequest("Telefon dostawcy jest wymagany");


        // 2. ZNajdŸ istniej¹cego, aktywnego dostawcê
        var existingDostawca = await _context.Dostawcy
            .Where(d => d.CzyAktywny)
            .FirstOrDefaultAsync(d => d.IdDostawcy == id);

        if (existingDostawca == null)
            return NotFound();

        // 3. AKTUALIZACJA
        _context.Entry(existingDostawca).CurrentValues.SetValues(dostawca);

        try
        {
            await _context.SaveChangesAsync();

            // SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(DostawcaController),
                nameof(PutDostawca),
                $"Zaktualizowano dostawcê {dostawca.Nazwa} (ID: {dostawca.IdDostawcy})");

            return NoContent();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await LoggerService.ZapiszB³adAsync(_context, nameof(DostawcaController), nameof(PutDostawca), ex);
            if (!DostawcaExists(id))
                return NotFound();
            throw;
        }
        catch (Exception ex)
        {
            await LoggerService.ZapiszB³adAsync(_context, nameof(DostawcaController), nameof(PutDostawca), ex);
            return StatusCode(500, "B³¹d serwera podczas aktualizacji dostawcy.");
        }
    }

    // DELETE: api/Dostawca/5 - miêkkie usuwanie
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<IActionResult> DeleteDostawca(int id)
    {
        try
        {
            var dostawca = await _context.Dostawcy
                .Include(d => d.Dokumenty)
                .FirstOrDefaultAsync(d => d.IdDostawcy == id);

            if (dostawca == null)
                return NotFound();

            // Miêkkie usuwanie
            dostawca.CzyAktywny = false;
            _context.Entry(dostawca).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            //SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(DostawcaController),
                nameof(DeleteDostawca),
                $"Dezaktywowano dostawcê {dostawca.Nazwa} (ID: {dostawca.IdDostawcy})");

            return NoContent();
        }
        catch (Exception ex)
        {
            // B£¥D – logujemy wyj¹tek
            await LoggerService.ZapiszB³adAsync(_context, nameof(DostawcaController), nameof(DeleteDostawca), ex);
            return StatusCode(500, "B³¹d serwera podczas usuwania dostawcy.");
        }
    }

    // GET: api/Dostawca/Search?query=abc
    [HttpGet("search")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<Dostawca>>> SearchDostawcy([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await _context.Dostawcy
                .Where(d => d.CzyAktywny)
                .ToListAsync();
        }

        var dostawcy = await _context.Dostawcy
            .FromSqlRaw("EXEC sp_SearchDostawcy @SearchQuery = {0}", query)
            .ToListAsync();

        return dostawcy;
    }
    private bool DostawcaExists(int id)
    {
        return _context.Dostawcy.Any(e => e.IdDostawcy == id);
    }
}