using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Controllers;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Xunit;

namespace SystemMagazynu.Tests.Controllers
{
    public class DostawcaControllerTests
    {
        private MagazynDbContext GetDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<MagazynDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new MagazynDbContext(options);
        }


        
        // 1. TEST GET – aktywni dostawcy
        
        [Fact]
        public async Task GetDostawcy_ReturnsOnlyActive()
        {
            using var context = GetDbContext("Db_GetDostawcy");

            context.Dostawcy.AddRange(
                new Dostawca { Nazwa = "A", Email = "a@a.com", Telefon = "111", CzyAktywny = true },
                new Dostawca { Nazwa = "B", Email = "b@b.com", Telefon = "222", CzyAktywny = false }
            );
            await context.SaveChangesAsync();

            var controller = new DostawcaController(context);

            // Act
            var result = await controller.GetDostawcy();

            // Assert
            var dostawcy = Assert.IsType<List<Dostawca>>(result.Value);
            Assert.Single(dostawcy);              
            Assert.Equal("A", dostawcy[0].Nazwa);
        }



        
        // 2. TEST POST – poprawny dostawca (201 Created)
        
        [Fact]
        public async Task PostDostawca_Valid_ReturnsCreated()
        {
            using var context = GetDbContext("Db_PostDostawca_OK");
            var controller = new DostawcaController(context);

            var newDostawca = new Dostawca
            {
                Nazwa = "Nowy Dostawca",
                Email = "test@test.com",
                Telefon = "123456789"
            };

            // Act
            var result = await controller.PostDostawca(newDostawca);

            // Assert
            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returned = Assert.IsType<Dostawca>(created.Value);

            Assert.Equal("Nowy Dostawca", returned.Nazwa);
            Assert.True(returned.CzyAktywny);              
            Assert.Single(context.Dostawcy);               
        }



       
        // 3. TEST POST – niepoprawny (brak nazwy  BadRequest)
        
        [Fact]
        public async Task PostDostawca_Invalid_ReturnsBadRequest()
        {
            using var context = GetDbContext("Db_PostDostawca_BAD");
            var controller = new DostawcaController(context);

            var invalid = new Dostawca
            {
                Nazwa = "",
                Email = "x@x.com",
                Telefon = "123"
            };

            // Act
            var result = await controller.PostDostawca(invalid);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Nazwa dostawcy jest wymagana", badRequest.Value);

            Assert.Empty(context.Dostawcy);   // nic nie zosta³o zapisane
        }
    }
}
