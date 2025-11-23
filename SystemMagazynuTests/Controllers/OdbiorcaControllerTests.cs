using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Controllers;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Xunit;

namespace SystemMagazynu.Tests.Controllers
{
    public class OdbiorcaControllerTests
    {
        private MagazynDbContext GetDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<MagazynDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new MagazynDbContext(options);
        }


        // 1. TEST GET – tylko aktywni odbiorcy
        [Fact]
        public async Task GetOdbiorcy_ReturnsOnlyActive()
        {
            using var context = GetDbContext("Db_GetOdbiorcy");

            context.Odbiorcy.AddRange(
                new Odbiorca { Nazwa = "Aktywny 1", Email = "a1@test.pl", CzyAktywny = true },
                new Odbiorca { Nazwa = "Aktywny 2", Email = "a2@test.pl", CzyAktywny = true },
                new Odbiorca { Nazwa = "Nieaktywny", Email = "z@test.pl", CzyAktywny = false }
            );
            await context.SaveChangesAsync();

            var controller = new OdbiorcaController(context);

            // Act
            var result = await controller.GetOdbiorcy();

            // Assert
            var odbiorcy = Assert.IsType<List<Odbiorca>>(result.Value);
            Assert.Equal(2, odbiorcy.Count);
            Assert.All(odbiorcy, o => Assert.True(o.CzyAktywny));
        }



        // 2. TEST POST – poprawny odbiorca
        [Fact]
        public async Task PostOdbiorca_Valid_ReturnsCreated()
        {
            using var context = GetDbContext("Db_PostOdbiorca_OK");
            var controller = new OdbiorcaController(context);

            var odbiorca = new Odbiorca
            {
                Nazwa = "Testowy Odbiorca",
                Email = "test@test.pl",
                Telefon = "123456789",
                Adres = "Testowy adres"
            };

            // Act
            var result = await controller.PostOdbiorca(odbiorca);

            // Assert
            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returned = Assert.IsType<Odbiorca>(created.Value);

            Assert.Equal("Testowy Odbiorca", returned.Nazwa);
            Assert.True(returned.CzyAktywny);
            Assert.Single(context.Odbiorcy);
        }



        // 3. TEST POST – niepoprawny (brak emaila)
        [Fact]
        public async Task PostOdbiorca_Invalid_ReturnsBadRequest()
        {
            using var context = GetDbContext("Db_PostOdbiorca_BAD");
            var controller = new OdbiorcaController(context);

            var invalid = new Odbiorca
            {
                Nazwa = "Odbiorca",
                Email = "",     // brak emaila  b³¹d
                Telefon = "123456789",
                Adres = "Testowy adres"
            };

            // Act
            var result = await controller.PostOdbiorca(invalid);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Email odbiorcy jest wymagany", badRequest.Value);

            Assert.Empty(context.Odbiorcy); // brak zapisu
        }
        // PUT – poprawna aktualizacja
        [Fact]
        public async Task PutOdbiorca_Valid_ReturnsNoContent()
        {
            using var context = GetDbContext("Db_PutOdbiorca_OK");
            var odbiorca = new Odbiorca { Nazwa = "Test", Email = "test@test.pl", Telefon = "123", Adres = "Adres", CzyAktywny = true };
            context.Odbiorcy.Add(odbiorca);
            await context.SaveChangesAsync();

            var controller = new OdbiorcaController(context);
            odbiorca.Nazwa = "nazwa";

            // Act
            var result = await controller.PutOdbiorca(odbiorca.IdOdbiorcy, odbiorca);

            // Assert
            Assert.IsType<NoContentResult>(result);
            var updated = await context.Odbiorcy.FindAsync(odbiorca.IdOdbiorcy);
            Assert.Equal("nazwa", updated!.Nazwa);
        }

        // PUT – niepoprawne ID
        [Fact]
        public async Task PutOdbiorca_InvalidId_ReturnsBadRequest()
        {
            using var context = GetDbContext("Db_PutOdbiorca_BadId");
            var odbiorca = new Odbiorca { IdOdbiorcy = 1, Nazwa = "Test", Email = "test@test.pl", Telefon = "123", Adres = "Adres", CzyAktywny = true };
            context.Odbiorcy.Add(odbiorca);
            await context.SaveChangesAsync();

            var controller = new OdbiorcaController(context);

            // Act
            var result = await controller.PutOdbiorca(999, odbiorca); // z³e ID

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("ID w œcie¿ce nie zgadza siê z ID w obiekcie", badRequest.Value);
        }

        // DELETE – miêkkie usuwanie
        [Fact]
        public async Task DeleteOdbiorca_Valid_ReturnsNoContent()
        {
            using var context = GetDbContext("Db_DeleteOdbiorca_OK");
            var odbiorca = new Odbiorca { Nazwa = "Do usuniêcia", Email = "test@test.pl", Telefon = "123", Adres = "Adres", CzyAktywny = true };
            context.Odbiorcy.Add(odbiorca);
            await context.SaveChangesAsync();

            var controller = new OdbiorcaController(context);

            // Act
            var result = await controller.DeleteOdbiorca(odbiorca.IdOdbiorcy);

            // Assert
            Assert.IsType<NoContentResult>(result);
            var deleted = await context.Odbiorcy.FindAsync(odbiorca.IdOdbiorcy)!;
            Assert.False(deleted!.CzyAktywny);
        }

        // DELETE – nieistniej¹cy odbiorca
        [Fact]
        public async Task DeleteOdbiorca_NotFound_ReturnsNotFound()
        {
            using var context = GetDbContext("Db_DeleteOdbiorca_NotFound");
            var controller = new OdbiorcaController(context);

            // Act
            var result = await controller.DeleteOdbiorca(999); 

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
