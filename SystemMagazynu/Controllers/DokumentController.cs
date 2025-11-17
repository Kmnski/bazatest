using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Microsoft.AspNetCore.Authorization;
using SystemMagazynu.DTOs;
using SystemMagazynu.Services;
using System;
using System.Threading;

namespace SystemMagazynu.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DokumentController : ControllerBase
{
    private readonly MagazynDbContext _context;

    public DokumentController(MagazynDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<DokumentListDto>>> GetDokumenty()
    {
        var dokumenty = await _context.Dokumenty
            .Include(d => d.Dostawca)
            .Include(d => d.Odbiorca)
            .Include(d => d.Magazyn)
            .Include(d => d.Uzytkownik)
            .Include(d => d.Pozycje)
                .ThenInclude(p => p.Material)
            .Select(d => new DokumentListDto
            {
                IdDokumentu = d.IdDokumentu,
                Typ = d.Typ,
                Data = d.Data,
                Status = d.Status,
                NumerDokumentu = d.NumerDokumentu,
                DostawcaNazwa = d.Dostawca != null ? d.Dostawca.Nazwa : "",
                OdbiorcaNazwa = d.Odbiorca != null ? d.Odbiorca.Nazwa : "",
                MagazynLokalizacja = d.Magazyn.Lokalizacja,
                UzytkownikEmail = d.Uzytkownik.Email,
                LiczbaPozycji = d.Pozycje.Count
            })
            .OrderBy(d => d.Status == "odrzucony" ? 1 :
                         d.Status == "oczekujacy" ? 2 : 3)
            .ThenByDescending(d => d.Data) 
            .ThenByDescending(d => d.IdDokumentu) 
            .ToListAsync();

        return dokumenty;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<DokumentResponseDto>> GetDokument(int id)
    {
        var dokument = await _context.Dokumenty
            .Include(d => d.Dostawca)
            .Include(d => d.Odbiorca)
            .Include(d => d.Magazyn)
            .Include(d => d.Uzytkownik)
            .Include(d => d.Pozycje)
                .ThenInclude(p => p.Material)
            .FirstOrDefaultAsync(d => d.IdDokumentu == id);

        if (dokument == null)
        {
            return NotFound();
        }

        var response = new DokumentResponseDto
        {
            IdDokumentu = dokument.IdDokumentu,
            Typ = dokument.Typ,
            Data = dokument.Data,
            Status = dokument.Status,
            NumerDokumentu = dokument.NumerDokumentu,
            DostawcaId = dokument.DostawcaId,
            DostawcaNazwa = dokument.Dostawca?.Nazwa ?? "",
            OdbiorcaId = dokument.OdbiorcaId,
            OdbiorcaNazwa = dokument.Odbiorca?.Nazwa ?? "",
            MagazynId = dokument.MagazynId,
            MagazynLokalizacja = dokument.Magazyn?.Lokalizacja ?? "",
            UzytkownikId = dokument.UzytkownikId,
            UzytkownikEmail = dokument.Uzytkownik?.Email ?? "",
            Pozycje = dokument.Pozycje.Select(p => new PozycjaResponseDto
            {
                IdPozycji = p.IdPozycji,
                Ilosc = p.Ilosc,
                MaterialId = p.MaterialId,
                MaterialNazwa = p.Material?.Nazwa ?? "",
                MaterialJednostka = p.Material?.Jednostka ?? ""
            }).ToList()
        };

        return response;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<DokumentResponseDto>> PostDokument(DokumentCreateDto dokumentDto, CancellationToken cancellationToken = default)
    {

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // 1. Walidacja kontrahenta
                if ((dokumentDto.Typ == "PZ" || dokumentDto.Typ == "PW") && (dokumentDto.DostawcaId == null || dokumentDto.DostawcaId == 0))
                    return BadRequest("Dostawca jest wymagany dla dokumentów przyjêcia");

                if ((dokumentDto.Typ == "WZ" || dokumentDto.Typ == "RW") && (dokumentDto.OdbiorcaId == null || dokumentDto.OdbiorcaId == 0))
                    return BadRequest("Odbiorca jest wymagany dla dokumentów wydania");

                // 2. Walidacja magazynu i u¿ytkownika
                var magazyn = await _context.Magazyny.FindAsync(dokumentDto.MagazynId);
                if (magazyn == null) return BadRequest("Magazyn nie istnieje");

                var uzytkownik = await _context.Uzytkownicy.FindAsync(dokumentDto.UzytkownikId);
                if (uzytkownik == null) return BadRequest("U¿ytkownik nie istnieje");

                // 3. Walidacja dostawcy / odbiorcy
                Dostawca? dostawca = null;
                Odbiorca? odbiorca = null;

                if (dokumentDto.Typ == "PZ" || dokumentDto.Typ == "PW")
                {
                    dostawca = await _context.Dostawcy.FindAsync(dokumentDto.DostawcaId);
                    if (dostawca == null) return BadRequest("Dostawca nie istnieje");
                }
                else
                {
                    odbiorca = await _context.Odbiorcy.FindAsync(dokumentDto.OdbiorcaId);
                    if (odbiorca == null) return BadRequest("Odbiorca nie istnieje");
                }

                // 4. Walidacja materia³ów i dostêpnoœci (dla WZ)
                foreach (var pozycja in dokumentDto.Pozycje)
                {
                    var material = await _context.Materialy.FindAsync(pozycja.MaterialId);
                    if (material == null)
                        return BadRequest($"Materia³ o ID {pozycja.MaterialId} nie istnieje");

                    if (dokumentDto.Typ == "WZ")
                    {
                        var stanMagazynowy = await _context.StanyMagazynowe
                            .FirstOrDefaultAsync(sm => sm.MagazynId == dokumentDto.MagazynId &&
                                                     sm.MaterialId == pozycja.MaterialId);

                        var zarezerwowane = await _context.RezerwacjeMaterialow
                            .Where(r => r.MagazynId == dokumentDto.MagazynId &&
                                       r.MaterialId == pozycja.MaterialId &&
                                       r.Status == "aktywna")
                            .SumAsync(r => (decimal?)r.ZarezerwowanaIlosc) ?? 0;

                        var dostepnaIlosc = (stanMagazynowy?.Ilosc ?? 0) - zarezerwowane;

                        if (dostepnaIlosc < pozycja.Ilosc)
                            return BadRequest($"Niewystarczaj¹ca iloœæ materia³u '{material.Nazwa}'. Dostêpne: {dostepnaIlosc}, ¿¹dane: {pozycja.Ilosc}");
                    }
                }

                // 5. Generowanie numeru dokumentu
                var numerDokumentu = await GenerujNumerDokumentuAsync(dokumentDto.Typ, dokumentDto.Data, cancellationToken);

                // 6. Tworzenie dokumentu
                var dokument = new Dokument
                {
                    Typ = dokumentDto.Typ,
                    Data = dokumentDto.Data,
                    Status = "oczekujacy",
                    NumerDokumentu = numerDokumentu,
                    DostawcaId = dokumentDto.DostawcaId,
                    OdbiorcaId = dokumentDto.OdbiorcaId,
                    MagazynId = dokumentDto.MagazynId,
                    UzytkownikId = dokumentDto.UzytkownikId,
                    Pozycje = dokumentDto.Pozycje.Select(p => new PozycjaDokumentu
                    {
                        Ilosc = p.Ilosc,
                        MaterialId = p.MaterialId
                    }).ToList()
                };

                _context.Dokumenty.Add(dokument);
                await _context.SaveChangesAsync();

                // 7. Rezerwacja materia³ów (dla WZ)
                if (dokumentDto.Typ == "WZ")
                {
                    foreach (var pozycja in dokumentDto.Pozycje)
                    {
                        var rezerwacja = new RezerwacjaMaterialu
                        {
                            MaterialId = pozycja.MaterialId,
                            MagazynId = dokumentDto.MagazynId,
                            DokumentId = dokument.IdDokumentu,
                            ZarezerwowanaIlosc = pozycja.Ilosc,
                            DataRezerwacji = DateTime.Now,
                            Status = "aktywna"
                        };
                        _context.RezerwacjeMaterialow.Add(rezerwacja);
                    }
                    await _context.SaveChangesAsync();
                }

                // 8. Za³adowanie powi¹zañ
                await _context.Entry(dokument).Reference(d => d.Dostawca).LoadAsync();
                await _context.Entry(dokument).Reference(d => d.Odbiorca).LoadAsync();
                await _context.Entry(dokument).Reference(d => d.Magazyn).LoadAsync();
                await _context.Entry(dokument).Reference(d => d.Uzytkownik).LoadAsync();
                await _context.Entry(dokument).Collection(d => d.Pozycje).LoadAsync();
                foreach (var pozycja in dokument.Pozycje)
                    await _context.Entry(pozycja).Reference(p => p.Material).LoadAsync();

                // 9. Mapowanie na DTO
                var response = new DokumentResponseDto
                {
                    IdDokumentu = dokument.IdDokumentu,
                    Typ = dokument.Typ,
                    Data = dokument.Data,
                    Status = dokument.Status,
                    NumerDokumentu = dokument.NumerDokumentu,
                    DostawcaId = dokument.DostawcaId,
                    DostawcaNazwa = dostawca?.Nazwa ?? "",
                    OdbiorcaId = dokument.OdbiorcaId,
                    OdbiorcaNazwa = odbiorca?.Nazwa ?? "",
                    MagazynId = dokument.MagazynId,
                    MagazynLokalizacja = magazyn.Lokalizacja,
                    UzytkownikId = dokument.UzytkownikId,
                    UzytkownikEmail = uzytkownik.Email,
                    Pozycje = dokument.Pozycje.Select(p => new PozycjaResponseDto
                    {
                        IdPozycji = p.IdPozycji,
                        Ilosc = p.Ilosc,
                        MaterialId = p.MaterialId,
                        MaterialNazwa = p.Material?.Nazwa ?? "",
                        MaterialJednostka = p.Material?.Jednostka ?? ""
                    }).ToList()
                };

                await transaction.CommitAsync();
                await LoggerService.ZapiszOperacjeAsync(_context,
                    nameof(DokumentController),
                    nameof(PostDokument),
                    $"Dodano dokument {dokument.Typ}/{dokument.NumerDokumentu} (ID: {dokument.IdDokumentu})");


                return CreatedAtAction(nameof(GetDokument), new { id = dokument.IdDokumentu }, response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LoggerService.ZapiszB³adAsync(_context, nameof(DokumentController), nameof(PutDokument), ex);
                return StatusCode(500, $"B³¹d podczas zapisu dokumentu: {ex.Message}");
            }
        });
}

    // Prywatna metoda generuj¹ca numer dokumentu
    private async Task<string> GenerujNumerDokumentuAsync(
        string typ, DateTime data, CancellationToken cancellationToken = default)
    {
        const int maxRetries = 5;
        int rok = data.Year;

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            var ostatnieNumery = await _context.Dokumenty
                .Where(d => d.Typ == typ && d.Data.Year == rok)
                .Select(d => d.NumerDokumentu)
                .ToListAsync(cancellationToken);

            int maxNumer = 0;
            foreach (var numer in ostatnieNumery)
            {
                var parts = numer.Split('/');
                if (parts.Length == 3 && int.TryParse(parts[2], out int n))
                    maxNumer = Math.Max(maxNumer, n);
            }

            string nowyNumer = $"{typ}/{rok}/{(maxNumer + 1):000000}";

            // Sprawdzenie, czy numer ju¿ istnieje (race-condition)
            bool exists = await _context.Dokumenty
                .AnyAsync(d => d.NumerDokumentu == nowyNumer, cancellationToken);

            if (!exists)
                return nowyNumer;

            // Czekaj chwilê i spróbuj ponownie
            await Task.Delay(Random.Shared.Next(50, 200), cancellationToken);
        }

        throw new InvalidOperationException("Nie uda³o siê wygenerowaæ unikalnego numeru dokumentu.");
    }


    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PutDokument(int id, DokumentUpdateDto dokumentDto, CancellationToken cancellationToken = default)
    {
        // ZnajdŸ istniej¹cy dokument
        var dokument = await _context.Dokumenty
            .Include(d => d.Pozycje)
            .FirstOrDefaultAsync(d => d.IdDokumentu == id);

        if (dokument == null)
        {
            return NotFound();
        }

        // ZABLOKUJ EDYCJÊ WSZYSTKICH STATUSÓW OPRÓCZ "odrzucony"
        if (dokument.Status != "odrzucony")
        {
            return BadRequest($"Nie mo¿na edytowaæ dokumentu ze statusem: {dokument.Status}. Edycja mo¿liwa tylko dla dokumentów odrzuconych.");
        }

        // Walidacja (taka sama jak wczeœniej)
        if ((dokumentDto.Typ == "PZ" || dokumentDto.Typ == "PW") && (dokumentDto.DostawcaId == null || dokumentDto.DostawcaId == 0))
            return BadRequest("Dostawca jest wymagany dla dokumentów przyjêcia");

        if ((dokumentDto.Typ == "WZ" || dokumentDto.Typ == "RW") && (dokumentDto.OdbiorcaId == null || dokumentDto.OdbiorcaId == 0))
            return BadRequest("Odbiorca jest wymagany dla dokumentów wydania");

        // SprawdŸ czy magazyn istnieje
        var magazyn = await _context.Magazyny.FindAsync(dokumentDto.MagazynId);
        if (magazyn == null) return BadRequest("Magazyn nie istnieje");

        // SprawdŸ czy kontrahenci istniej¹
        if (dokumentDto.Typ == "PZ" || dokumentDto.Typ == "PW")
        {
            var dostawca = await _context.Dostawcy.FindAsync(dokumentDto.DostawcaId);
            if (dostawca == null) return BadRequest("Dostawca nie istnieje");
        }
        else
        {
            var odbiorca = await _context.Odbiorcy.FindAsync(dokumentDto.OdbiorcaId);
            if (odbiorca == null) return BadRequest("Odbiorca nie istnieje");
        }

        // WALIDACJA MATERIA£ÓW
        foreach (var pozycja in dokumentDto.Pozycje)
        {
            var material = await _context.Materialy.FindAsync(pozycja.MaterialId);
            if (material == null)
                return BadRequest($"Material o ID {pozycja.MaterialId} nie istnieje");

            // DLA WZ - SPRAWD DOSTÊPNOŒÆ MATERIA£ÓW
            if (dokumentDto.Typ == "WZ")
            {
                var stanMagazynowy = await _context.StanyMagazynowe
                    .FirstOrDefaultAsync(sm => sm.MagazynId == dokumentDto.MagazynId &&
                                             sm.MaterialId == pozycja.MaterialId);

                var zarezerwowane = await _context.RezerwacjeMaterialow
                    .Where(r => r.MagazynId == dokumentDto.MagazynId &&
                               r.MaterialId == pozycja.MaterialId &&
                               r.Status == "aktywna" &&
                               r.DokumentId != id) // Wyklucz aktualny dokument
                    .SumAsync(r => (decimal?)r.ZarezerwowanaIlosc) ?? 0;

                var dostepnaIlosc = (stanMagazynowy?.Ilosc ?? 0) - zarezerwowane;

                if (dostepnaIlosc < pozycja.Ilosc)
                {
                    return BadRequest($"Niewystarczaj¹ca iloœæ materia³u '{material.Nazwa}'. Dostêpne: {dostepnaIlosc}, ¿¹dane: {pozycja.Ilosc}");
                }
            }
        }

       
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // 1. Walidacja (ca³a istniej¹ca logika – bez zmian)

                // 2. Generowanie numeru
                var numerDokumentu = await GenerujNumerDokumentuAsync(dokumentDto.Typ, dokumentDto.Data, cancellationToken);

                // 3. Tworzenie NOWEGO dokumentu (Twoja logika – bez zmian)
                var nowyDokument = new Dokument
                {
                    Typ = dokumentDto.Typ,
                    Data = dokumentDto.Data,
                    Status = "oczekujacy",
                    MagazynId = dokumentDto.MagazynId,
                    DostawcaId = dokumentDto.DostawcaId,
                    OdbiorcaId = dokumentDto.OdbiorcaId,
                    UzytkownikId = dokument.UzytkownikId,
                    NumerDokumentu = numerDokumentu,
                    Pozycje = dokumentDto.Pozycje.Select(p => new PozycjaDokumentu
                    {
                        MaterialId = p.MaterialId,
                        Ilosc = p.Ilosc
                    }).ToList()
                };

                // 4. ZAPISZ NOWY DOKUMENT
                _context.Dokumenty.Add(nowyDokument);
                await _context.SaveChangesAsync();

                // 5. SUKCES – logujemy operacjê
                await LoggerService.ZapiszOperacjeAsync(_context,
                    nameof(DokumentController),
                    nameof(PutDokument),
                    $"Zaktualizowano dokument {nowyDokument.Typ}/{nowyDokument.NumerDokumentu} (ID: {nowyDokument.IdDokumentu})");

                await transaction.CommitAsync();
                return Ok(new { message = "Dokument zosta³ zaktualizowany", newDocumentId = nowyDokument.IdDokumentu });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LoggerService.ZapiszB³adAsync(_context, nameof(DokumentController), nameof(PutDokument), ex);
                return StatusCode(500, "B³¹d serwera podczas aktualizacji dokumentu.");
            }
        }

        [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDokument(int id)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var dokument = await _context.Dokumenty
                .Include(d => d.Pozycje)
                .FirstOrDefaultAsync(d => d.IdDokumentu == id);

            if (dokument == null)
                return NotFound();

            // TYLKO DLA WZ - USUÑ REZERWACJE
            if (dokument.Typ == "WZ")
            {
                var rezerwacje = await _context.RezerwacjeMaterialow
                    .Where(r => r.DokumentId == id)
                    .ToListAsync();

                if (rezerwacje.Any())
                    _context.RezerwacjeMaterialow.RemoveRange(rezerwacje);
            }

            // USUÑ POZYCJE DOKUMENTU
            if (dokument.Pozycje.Any())
                _context.PozycjeDokumentow.RemoveRange(dokument.Pozycje);

            // USUÑ DOKUMENT
            _context.Dokumenty.Remove(dokument);
            await _context.SaveChangesAsync();

            //SUKCES – logujemy operacjê
            await LoggerService.ZapiszOperacjeAsync(_context,
                nameof(DokumentController),
                nameof(DeleteDokument),
                $"Usuniêto dokument {dokument.Typ}/{dokument.NumerDokumentu} (ID: {dokument.IdDokumentu})");

            await transaction.CommitAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            await LoggerService.ZapiszB³adAsync(_context, nameof(DokumentController), nameof(DeleteDokument), ex);
            return StatusCode(500, "B³¹d serwera podczas usuwania dokumentu.");
        }
    }

    private bool DokumentExists(int id)
    {
        return _context.Dokumenty.Any(e => e.IdDokumentu == id);
    }

    [HttpGet("search")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<DokumentListDto>>> SearchDokumenty([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await GetDokumenty();
        }

        var searchTerm = $"%{query}%";

        var dokumenty = await _context.Dokumenty
            .Include(d => d.Dostawca)
            .Include(d => d.Odbiorca)
            .Include(d => d.Magazyn)
            .Include(d => d.Uzytkownik)
            .Include(d => d.Pozycje)
                .ThenInclude(p => p.Material)
            .Where(d =>
                EF.Functions.Like(d.NumerDokumentu, searchTerm) ||
                EF.Functions.Like(d.Typ, searchTerm) ||
                (d.Dostawca != null && EF.Functions.Like(d.Dostawca.Nazwa, searchTerm)) ||
                (d.Odbiorca != null && EF.Functions.Like(d.Odbiorca.Nazwa, searchTerm)) ||
                (d.Magazyn != null && EF.Functions.Like(d.Magazyn.Lokalizacja, searchTerm))
            )
            .Select(d => new DokumentListDto
            {
                IdDokumentu = d.IdDokumentu,
                Typ = d.Typ,
                Data = d.Data,
                Status = d.Status,
                NumerDokumentu = d.NumerDokumentu,
                DostawcaNazwa = d.Dostawca != null ? d.Dostawca.Nazwa : "",
                OdbiorcaNazwa = d.Odbiorca != null ? d.Odbiorca.Nazwa : "",
                MagazynLokalizacja = d.Magazyn.Lokalizacja,
                UzytkownikEmail = d.Uzytkownik.Email,
                LiczbaPozycji = d.Pozycje.Count
            })
            .OrderByDescending(d => d.Data)
            .ToListAsync();

        return dokumenty;
    }

    [HttpGet("{id}/pozycje")]
    [Authorize(Roles = "Admin,Magazynier")]
    public async Task<ActionResult<IEnumerable<PozycjaResponseDto>>> GetPozycjeDokumentu(int id)
    {
        // SprawdŸ czy dokument istnieje
        var dokumentExists = await _context.Dokumenty.AnyAsync(d => d.IdDokumentu == id);
        if (!dokumentExists)
        {
            return NotFound($"Dokument o ID {id} nie istnieje");
        }

        // U¯YJ POPRAWNEJ NAZWY DbSet - sprawdŸ jak masz w MagazynDbContext
        var pozycje = await _context.PozycjeDokumentow 
            .Where(p => p.DokumentId == id)
            .Include(p => p.Material)
            .Select(p => new PozycjaResponseDto
            {
                IdPozycji = p.IdPozycji,
                Ilosc = p.Ilosc,
                MaterialId = p.MaterialId,
                MaterialNazwa = p.Material.Nazwa,
                MaterialOpis = p.Material.Opis,
                MaterialJednostka = p.Material.Jednostka
            })
            .ToListAsync();

        return Ok(pozycje);
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<DokumentResponseDto>>> GetPendingDocuments()
    {
        var dokumenty = await _context.Dokumenty
            .Include(d => d.Dostawca)
            .Include(d => d.Odbiorca)
            .Include(d => d.Magazyn)
            .Include(d => d.Uzytkownik)
            .Include(d => d.Pozycje)
                .ThenInclude(p => p.Material)
            .Where(d => d.Status == "oczekujacy")
            .Select(d => new DokumentResponseDto
            {
                IdDokumentu = d.IdDokumentu,
                Typ = d.Typ,
                Data = d.Data,
                Status = d.Status,
                NumerDokumentu = d.NumerDokumentu,
                DostawcaNazwa = d.Dostawca != null ? d.Dostawca.Nazwa : "",
                OdbiorcaNazwa = d.Odbiorca != null ? d.Odbiorca.Nazwa : "",
                MagazynLokalizacja = d.Magazyn.Lokalizacja,
                UzytkownikEmail = d.Uzytkownik.Email,
                Pozycje = d.Pozycje.Select(p => new PozycjaResponseDto
                {
                    IdPozycji = p.IdPozycji,
                    MaterialNazwa = p.Material.Nazwa,
                    Ilosc = p.Ilosc,
                    MaterialJednostka = p.Material.Jednostka
                }).ToList()
            })
            .OrderBy(d => d.Data)
            .ToListAsync();

        return dokumenty;
    }

    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveDocument(int id)
    {
        try
        {
            var dokument = await _context.Dokumenty
                .FirstOrDefaultAsync(d => d.IdDokumentu == id);

            if (dokument == null) return NotFound("Dokument nie istnieje");
            if (dokument.Status != "oczekujacy")
                return BadRequest("Dokument nie jest w statusie oczekuj¹cym");

            // U¯YJ ExecuteSqlRawAsync ZAMIAST SaveChangesAsync
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE Dokumenty SET Status = 'zatwierdzony' WHERE IdDokumentu = {0}",
                id);

            return Ok(new { message = "Dokument zosta³ zatwierdzony" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"B³¹d: {ex.Message}");
        }
    }

    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectDocument(int id)
    {
        try
        {
            var dokument = await _context.Dokumenty
                .FirstOrDefaultAsync(d => d.IdDokumentu == id);

            if (dokument == null) return NotFound("Dokument nie istnieje");
            if (dokument.Status != "oczekujacy")
                return BadRequest("Dokument nie jest w statusie oczekuj¹cym");

            // U¯YJ ExecuteSqlRawAsync
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE Dokumenty SET Status = 'odrzucony' WHERE IdDokumentu = {0}",
                id);

            return Ok(new { message = "Dokument zosta³ odrzucony" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"B³¹d: {ex.Message}");
        }
    }

}