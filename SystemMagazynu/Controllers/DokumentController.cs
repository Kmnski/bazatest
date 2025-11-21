using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Microsoft.AspNetCore.Authorization;
using SystemMagazynu.DTOs;
using SystemMagazynu.Services;
using System;
using System.Threading;
using Microsoft.Data.SqlClient;
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

                        var dostepnaIlosc = stanMagazynowy?.Ilosc ?? 0;

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
                    UzytkownikId = dokumentDto.UzytkownikId
                };

                // dodajemy dokument bez pozycji
                _context.Dokumenty.Add(dokument);
                await _context.SaveChangesAsync();

                foreach (var p in dokumentDto.Pozycje)
                {
                    var pozycja = new PozycjaDokumentu
                    {
                        DokumentId = dokument.IdDokumentu,
                        Ilosc = p.Ilosc,
                        MaterialId = p.MaterialId
                    };
                    _context.PozycjeDokumentow.Add(pozycja);
                }
                await _context.SaveChangesAsync();


                // 7. Rezerwacja materia³ów (dla WZ) - rêczny insert
                if (dokumentDto.Typ == "WZ")
                {
                    var sql = @"
        INSERT INTO RezerwacjeMaterialow 
            (MaterialId, MagazynId, DokumentId, ZarezerwowanaIlosc, DataRezerwacji)
        VALUES (@MaterialId, @MagazynId, @DokumentId, @ZarezerwowanaIlosc, @DataRezerwacji)";

                    foreach (var p in dokumentDto.Pozycje)
                    {
                        await _context.Database.ExecuteSqlRawAsync(sql,
                            new SqlParameter("@MaterialId", p.MaterialId),
                            new SqlParameter("@MagazynId", dokumentDto.MagazynId),
                            new SqlParameter("@DokumentId", dokument.IdDokumentu),
                            new SqlParameter("@ZarezerwowanaIlosc", p.Ilosc),
                            new SqlParameter("@DataRezerwacji", DateTime.Now)
                        );
                    }
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
        var strategy = _context.Database.CreateExecutionStrategy();
        IActionResult result = null!;

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var dokument = await _context.Dokumenty
                    .Include(d => d.Pozycje)
                    .FirstOrDefaultAsync(d => d.IdDokumentu == id, cancellationToken);

                if (dokument == null) { result = NotFound(); return; }
                if (dokument.Status != "odrzucony")
                {
                    result = BadRequest($"Nie mo¿na edytowaæ dokumentu ze statusem: {dokument.Status}. Edycja mo¿liwa tylko dla dokumentów odrzuconych.");
                    return;
                }

                // Walidacja kontrahenta
                if ((dokumentDto.Typ == "PZ" || dokumentDto.Typ == "PW") && (dokumentDto.DostawcaId == null || dokumentDto.DostawcaId == 0))
                {
                    result = BadRequest("Dostawca jest wymagany dla dokumentów przyjêcia");
                    return;
                }
                if ((dokumentDto.Typ == "WZ" || dokumentDto.Typ == "RW") && (dokumentDto.OdbiorcaId == null || dokumentDto.OdbiorcaId == 0))
                {
                    result = BadRequest("Odbiorca jest wymagany dla dokumentów wydania");
                    return;
                }

                // Walidacja magazynu
                var magazyn = await _context.Magazyny.FindAsync(new object[] { dokumentDto.MagazynId }, cancellationToken);
                if (magazyn == null) { result = BadRequest("Magazyn nie istnieje"); return; }

                // Walidacja kontrahentów
                if (dokumentDto.Typ == "PZ" || dokumentDto.Typ == "PW")
                {
                    var dostawca = await _context.Dostawcy.FindAsync(new object[] { dokumentDto.DostawcaId }, cancellationToken);
                    if (dostawca == null) { result = BadRequest("Dostawca nie istnieje"); return; }
                }
                else
                {
                    var odbiorca = await _context.Odbiorcy.FindAsync(new object[] { dokumentDto.OdbiorcaId }, cancellationToken);
                    if (odbiorca == null) { result = BadRequest("Odbiorca nie istnieje"); return; }
                }

                // Walidacja materia³ów
                foreach (var pozycja in dokumentDto.Pozycje)
                {
                    var material = await _context.Materialy.FindAsync(new object[] { pozycja.MaterialId }, cancellationToken);
                    if (material == null) { result = BadRequest($"Material o ID {pozycja.MaterialId} nie istnieje"); return; }

                    if (dokumentDto.Typ == "WZ")
                    {
                        var stanMagazynowy = await _context.StanyMagazynowe
                            .FirstOrDefaultAsync(sm => sm.MagazynId == dokumentDto.MagazynId && sm.MaterialId == pozycja.MaterialId, cancellationToken);

                        var zarezerwowane = await _context.RezerwacjeMaterialow
                            .Where(r => r.MagazynId == dokumentDto.MagazynId && r.MaterialId == pozycja.MaterialId && r.DokumentId != id)
                            .SumAsync(r => (decimal?)r.ZarezerwowanaIlosc, cancellationToken) ?? 0;

                        var dostepnaIlosc = (stanMagazynowy?.Ilosc ?? 0) - zarezerwowane;
                        if (dostepnaIlosc < pozycja.Ilosc)
                        {
                            result = BadRequest($"Niewystarczaj¹ca iloœæ materia³u '{material.Nazwa}'. Dostêpne: {dostepnaIlosc}, ¿¹dane: {pozycja.Ilosc}");
                            return;
                        }
                    }
                }

                // Generowanie nowego numeru dokumentu
                var numerDokumentu = await GenerujNumerDokumentuAsync(dokumentDto.Typ, dokumentDto.Data, cancellationToken);

                // Aktualizacja dokumentu za pomoc¹ natywnego SQL
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE Dokumenty SET Typ = {0}, Data = {1}, MagazynId = {2}, DostawcaId = {3}, OdbiorcaId = {4}, Status = {5}, NumerDokumentu = {6} WHERE IdDokumentu = {7}",
                    dokumentDto.Typ,
                    dokumentDto.Data,
                    dokumentDto.MagazynId,
                    dokumentDto.DostawcaId,
                    dokumentDto.OdbiorcaId,
                    "oczekujacy",
                    numerDokumentu,
                    dokument.IdDokumentu);

                // Usuñ stare pozycje dokumentu
                if (dokument.Pozycje.Any())
                {
                    var pozycjeIds = dokument.Pozycje.Select(p => p.IdPozycji).ToArray();
                    await _context.Database.ExecuteSqlRawAsync(
                        $"DELETE FROM PozycjeDokumentow WHERE IdPozycji IN ({string.Join(",", pozycjeIds)})");
                }

                // Dodaj nowe pozycje dokumentu
                foreach (var p in dokumentDto.Pozycje)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "INSERT INTO PozycjeDokumentow (DokumentId, Ilosc, MaterialId) VALUES ({0}, {1}, {2})",
                        dokument.IdDokumentu,
                        p.Ilosc,
                        p.MaterialId);
                }

                // Zaloguj operacjê
                await LoggerService.ZapiszOperacjeAsync(_context, nameof(DokumentController), nameof(PutDokument),
                    $"Zaktualizowano dokument {dokumentDto.Typ}/{numerDokumentu} (ID: {dokument.IdDokumentu})");

                await transaction.CommitAsync(cancellationToken);
                result = Ok(new { message = "Dokument zosta³ zaktualizowany", documentId = dokument.IdDokumentu });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                await LoggerService.ZapiszBladBezOutputAsync(_context, nameof(DokumentController), nameof(PutDokument), ex);
                result = StatusCode(500, "B³¹d serwera podczas aktualizacji dokumentu.");
            }
        });

        return result;
    }





    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDokument(int id)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        IActionResult result = null!;

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var dokument = await _context.Dokumenty
                    .Include(d => d.Pozycje)
                    .FirstOrDefaultAsync(d => d.IdDokumentu == id);

                if (dokument == null) { result = NotFound(); return; }

                if (dokument.Typ == "WZ")
                {
                    var rezerwacje = await _context.RezerwacjeMaterialow
                        .Where(r => r.DokumentId == id)
                        .ToListAsync();

                    if (rezerwacje.Any())
                        _context.RezerwacjeMaterialow.RemoveRange(rezerwacje);
                }

                if (dokument.Pozycje.Any())
                    _context.PozycjeDokumentow.RemoveRange(dokument.Pozycje);

                _context.Dokumenty.Remove(dokument);
                await _context.SaveChangesAsync();

                await LoggerService.ZapiszOperacjeAsync(_context, nameof(DokumentController), nameof(DeleteDokument),
                    $"Usuniêto dokument {dokument.Typ}/{dokument.NumerDokumentu} (ID: {dokument.IdDokumentu})");

                await transaction.CommitAsync();
                result = NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LoggerService.ZapiszB³adAsync(_context, nameof(DokumentController), nameof(DeleteDokument), ex);
                result = StatusCode(500, "B³¹d serwera podczas usuwania dokumentu.");
            }
        });

        return result;
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