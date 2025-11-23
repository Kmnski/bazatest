using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Controllers;
using SystemMagazynu.Data;
using SystemMagazynu.Models;
using Xunit;

namespace SystemMagazynu.Tests.Controllers
{
    public class MaterialyControllerTests
    {
        private MagazynDbContext GetDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<MagazynDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            return new MagazynDbContext(options);
        }

        
        [Fact]
        public async Task GetMaterialy()
        {
            using var context = GetDbContext("TestDb_GetMaterialy");

            context.Materialy.AddRange(
                new Material { Nazwa = "Stal",Opis = "tttt", Jednostka = "kg" },
                new Material { Nazwa = "Drewno", Jednostka = "m3" }
            );
            await context.SaveChangesAsync();

            var controller = new MaterialyController(context);

            // Act
            var result = await controller.GetMaterialy();

            // Assert
            var materialy = Assert.IsType<List<Material>>(result.Value);
            Assert.Equal(2, materialy.Count);
        }



        [Fact]
        public async Task PostMateriall()
        {
            using var context = GetDbContext("TestDb_PostMaterial");

            var controller = new MaterialyController(context);

            var material = new Material
            {
                Nazwa = "Aluminium",
                Jednostka = "kg",
                Opis = "Lekki metal"
            };

            // Act
            var result = await controller.PostMaterial(material);

            // Assert
            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returnedMaterial = Assert.IsType<Material>(created.Value);

            Assert.Equal("Aluminium", returnedMaterial.Nazwa);
            Assert.Equal("kg", returnedMaterial.Jednostka);
            Assert.Equal(1, context.Materialy.Count());
        }

        [Fact]
        public async Task NoPostMateriall()
        {
            using var context = GetDbContext("TestDb_NoPostMateriall");

            var controller = new MaterialyController(context);

            var material = new Material
            {
                Nazwa = "",
                Jednostka = "kg",
                Opis = "Lekki metal"
            };

            // Act
            var result = await controller.PostMaterial(material);

            // Assert – oczekujemy 400 BadRequest
            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Nazwa materia³u jest wymagana", badRequest.Value);

            // Dodatkowe bezpieczeñstwo — nie zapisa³ siê do bazy
            Assert.Empty(context.Materialy);
        }

    }


}
