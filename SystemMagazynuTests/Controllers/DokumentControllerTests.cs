using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Controllers;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using SystemMagazynu.DTOs;
using Xunit;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace SystemMagazynu.Tests.Controllers
{
    public class DokumentControllerTests
    {
        private MagazynDbContext GetDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<MagazynDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new MagazynDbContext(options);
        }

        [Fact]
        public async Task GetDokumenty_ReturnsDocuments()
        {
            using var context = GetDbContext("Db_GetDokumenty");

            var uzytkownik = new Uzytkownik { Id = 1, Email = "user@test.pl" };
            var magazyn = new Magazyn { IdMagazynu = 1, Lokalizacja = "Magazyn A" };

            context.Uzytkownicy.Add(uzytkownik);
            context.Magazyny.Add(magazyn);
            context.Dokumenty.AddRange(
                new Dokument
                {
                    IdDokumentu = 1,
                    Typ = "PZ",
                    Data = System.DateTime.Now,
                    Status = "oczekujacy",
                    NumerDokumentu = "PZ/2025/000001",
                    Magazyn = magazyn,
                    Uzytkownik = uzytkownik
                }
            );
            await context.SaveChangesAsync();

            var controller = new DokumentController(context);

            // Act
            var result = await controller.GetDokumenty();

            // Assert
            var dokumenty = Assert.IsType<List<DokumentListDto>>(result.Value);
            Assert.Single(dokumenty);
            Assert.Equal("PZ", dokumenty[0].Typ);
        }

        
    }
}
