using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Data;
using SystemMagazynu.Models;

namespace SystemMagazynu.Services;

public static class LoggerService
{
	public static async Task ZapiszB³adAsync(MagazynDbContext context,
		string kontroler, string akcja, Exception ex)
	{
		var log = new LogBledu
		{
			Kontroler = kontroler,
			Akcja = akcja,
			Komunikat = ex.Message,
			StackTrace = ex.StackTrace
		};
		context.LogiBledow.Add(log);
		await context.SaveChangesAsync();
	}

	public static async Task ZapiszOperacjeAsync(MagazynDbContext context,
	string kontroler, string akcja, string komunikat)
	{
		var log = new LogBledu
		{
			Kontroler = kontroler,
			Akcja = akcja,
			Komunikat = komunikat,
			StackTrace = null,          // nie jest b³êdem
			Data = DateTime.Now
		};
		context.LogiBledow.Add(log);
		await context.SaveChangesAsync();
	}

    public static async Task ZapiszBladBezOutputAsync(MagazynDbContext context, string kontroler, string akcja, Exception ex)
    {
        try
        {
            // Utwórz nowy kontekst dla logowania, aby unikn¹æ konfliktów
            using var logContext = new MagazynDbContext(new DbContextOptionsBuilder<MagazynDbContext>()
                .UseSqlServer(context.Database.GetConnectionString())
                .Options);

            var logBledu = new LogBledu
            {
                Kontroler = kontroler,
                Akcja = akcja,
                Data = DateTime.Now,
                Komunikat = ex.Message,
                StackTrace = ex.StackTrace
            };

            logContext.LogiBledow.Add(logBledu);
            await logContext.SaveChangesAsync();
        }
        catch
        {
            // Jeœli logowanie siê nie uda, zignoruj b³¹d aby nie maskowaæ oryginalnego wyj¹tku
        }
    }
}