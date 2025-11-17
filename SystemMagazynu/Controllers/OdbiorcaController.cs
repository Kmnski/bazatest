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
public class OdbiorcaController : ControllerBase
{
    private readonly MagazynDbContext _context;

    public OdbiorcaController(MagazynDbContext context)
    {
        _context = context;
    }

    // GET: api/Odbiorca - zwraca tylko aktywnych odbiorców
    [HttpGet]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<Odbiorca>>> GetOdbiorcy()
    {
        return await _context.Odbiorcy
            .Where(o => o.CzyAktywny)
            .ToListAsync();
    }

    // GET: api/Odbiorca/5 - DODAJ TE METODÊ
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<Odbiorca>> GetOdbiorca(int id)
    {
        var odbiorca = await _context.Odbiorcy
            .Where(o => o.CzyAktywny)
            .FirstOrDefaultAsync(o => o.IdOdbiorcy == id);

        if (odbiorca == null)
        {
            return NotFound();
        }

        return odbiorca;
    }

    // POST: api/Odbiorca
    [HttpPost]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<Odbiorca>> PostOdbiorca(Odbiorca odbiorca)
    {
        // 1. WALIDACJA WEJŒCIA
        if (string.IsNullOrWhiteSpace(odbiorca.Nazwa))
            return BadRequest("Nazwa odbiorcy jest wymagana");
        if (string.IsNullOrWhiteSpace(odbiorca.Email))
            return BadRequest("Email odbiorcy jest wymagany");
        if (string.IsNullOrWhiteSpace(odbiorca.Telefon))
            return BadRequest("Telefon odbiorcy jest wymagany");
        if (string.IsNullOrWhiteSpace(odbiorca.Adres))
            return BadRequest("Adres odbiorcy jest wymagany");

        try
        {
            // 2. ZAPIS
            odbiorca.CzyAktywny = true;
            _context.Odbiorcy.Add(odbiorca);
            await _context.SaveChangesAsync();

            // 3. SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(OdbiorcaController),
                nameof(PostOdbiorca),
                $"Dodano odbiorcê {odbiorca.Nazwa} (ID: {odbiorca.IdOdbiorcy})");

            return CreatedAtAction(nameof(GetOdbiorca), new { id = odbiorca.IdOdbiorcy }, odbiorca);
        }
        catch (Exception ex)
        {
            // 4. B£¥D – logujemy wyj¹tek
            await LoggerService.ZapiszB³adAsync(_context, nameof(OdbiorcaController), nameof(PostOdbiorca), ex);
            return StatusCode(500, "B³¹d serwera podczas dodawania odbiorcy.");
        }
    }

    // PUT: api/Odbiorca/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<IActionResult> PutOdbiorca(int id, Odbiorca odbiorca)
    {
        // 1. WALIDACJA WEJŒCIA
        if (id != odbiorca.IdOdbiorcy)
            return BadRequest("ID w œcie¿ce nie zgadza siê z ID w obiekcie");

        if (string.IsNullOrWhiteSpace(odbiorca.Nazwa))
            return BadRequest("Nazwa odbiorcy jest wymagana");
        if (string.IsNullOrWhiteSpace(odbiorca.Email))
            return BadRequest("Email odbiorcy jest wymagany");
        if (string.IsNullOrWhiteSpace(odbiorca.Telefon))
            return BadRequest("Telefon odbiorcy jest wymagany");
        if (string.IsNullOrWhiteSpace(odbiorca.Adres))
            return BadRequest("Adres odbiorcy jest wymagany");

        // 2. ZNajdŸ istniej¹cego, aktywnego odbiorcê
        var existingOdbiorca = await _context.Odbiorcy
            .Where(o => o.CzyAktywny)
            .FirstOrDefaultAsync(o => o.IdOdbiorcy == id);

        if (existingOdbiorca == null)
            return NotFound();

        // 3. AKTUALIZACJA
        odbiorca.CzyAktywny = existingOdbiorca.CzyAktywny;
        _context.Entry(existingOdbiorca).CurrentValues.SetValues(odbiorca);

        try
        {
            await _context.SaveChangesAsync();

            // SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(OdbiorcaController),
                nameof(PutOdbiorca),
                $"Zaktualizowano odbiorcê {odbiorca.Nazwa} (ID: {odbiorca.IdOdbiorcy})");

            return NoContent();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await LoggerService.ZapiszB³adAsync(_context, nameof(OdbiorcaController), nameof(PutOdbiorca), ex);
            if (!OdbiorcaExists(id))
                return NotFound();
            throw;
        }
        catch (Exception ex) 
        {
            await LoggerService.ZapiszB³adAsync(_context, nameof(OdbiorcaController), nameof(PutOdbiorca), ex);
            return StatusCode(500, "B³¹d serwera podczas aktualizacji odbiorcy.");
        }
    }
    
    // DELETE: api/Odbiorca/5 - miêkkie usuwanie
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<IActionResult> DeleteOdbiorca(int id)
    {
        try
        {
            var odbiorca = await _context.Odbiorcy
                .FirstOrDefaultAsync(o => o.IdOdbiorcy == id);

            if (odbiorca == null)
                return NotFound();

            // Miêkkie usuwanie
            odbiorca.CzyAktywny = false;
            _context.Entry(odbiorca).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(OdbiorcaController),
                nameof(DeleteOdbiorca),
                $"Dezaktywowano odbiorcê {odbiorca.Nazwa} (ID: {odbiorca.IdOdbiorcy})");

            return NoContent();
        }
        catch (Exception ex)
        {
            //B£¥D – logujemy wyj¹tek
            await LoggerService.ZapiszB³adAsync(_context, nameof(OdbiorcaController), nameof(DeleteOdbiorca), ex);
            return StatusCode(500, "B³¹d serwera podczas usuwania odbiorcy.");
        }
    }

    // GET: api/Odbiorca/search?query=abc - wyszukuje tylko aktywnych odbiorców
    [HttpGet("search")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<Odbiorca>>> SearchOdbiorcy([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await _context.Odbiorcy
                .Where(o => o.CzyAktywny)
                .ToListAsync();
        }

        
        var odbiorcy = await _context.Odbiorcy
            .FromSqlRaw("EXEC sp_SearchOdbiorcy @SearchQuery", query)
            .ToListAsync();

        return odbiorcy;
    }

    private bool OdbiorcaExists(int id)
    {
        return _context.Odbiorcy.Any(e => e.IdOdbiorcy == id);
    }

}