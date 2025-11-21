using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SystemMagazynu.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Dostawcy",
                columns: table => new
                {
                    IdDostawcy = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nazwa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Telefon = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CzyAktywny = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dostawcy", x => x.IdDostawcy);
                });

            migrationBuilder.CreateTable(
                name: "LogiBledow",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Data = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Kontroler = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Akcja = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Komunikat = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StackTrace = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogiBledow", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Magazyny",
                columns: table => new
                {
                    IdMagazynu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Lokalizacja = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Typ = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Magazyny", x => x.IdMagazynu);
                });

            migrationBuilder.CreateTable(
                name: "Materialy",
                columns: table => new
                {
                    IdMaterialu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nazwa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Opis = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Jednostka = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materialy", x => x.IdMaterialu);
                });

            migrationBuilder.CreateTable(
                name: "Odbiorcy",
                columns: table => new
                {
                    IdOdbiorcy = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nazwa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telefon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Adres = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CzyAktywny = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Odbiorcy", x => x.IdOdbiorcy);
                });

            migrationBuilder.CreateTable(
                name: "Uzytkownicy",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HasloHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rola = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Imie = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nazwisko = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataRejestracji = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CzyAktywny = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Uzytkownicy", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StanyMagazynowe",
                columns: table => new
                {
                    MagazynId = table.Column<int>(type: "int", nullable: false),
                    MaterialId = table.Column<int>(type: "int", nullable: false),
                    Ilosc = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StanyMagazynowe", x => new { x.MagazynId, x.MaterialId });
                    table.ForeignKey(
                        name: "FK_StanyMagazynowe_Magazyny_MagazynId",
                        column: x => x.MagazynId,
                        principalTable: "Magazyny",
                        principalColumn: "IdMagazynu",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StanyMagazynowe_Materialy_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materialy",
                        principalColumn: "IdMaterialu",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Dokumenty",
                columns: table => new
                {
                    IdDokumentu = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Typ = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Data = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NumerDokumentu = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DostawcaId = table.Column<int>(type: "int", nullable: true),
                    OdbiorcaId = table.Column<int>(type: "int", nullable: true),
                    MagazynId = table.Column<int>(type: "int", nullable: false),
                    UzytkownikId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dokumenty", x => x.IdDokumentu);
                    table.ForeignKey(
                        name: "FK_Dokumenty_Dostawcy_DostawcaId",
                        column: x => x.DostawcaId,
                        principalTable: "Dostawcy",
                        principalColumn: "IdDostawcy");
                    table.ForeignKey(
                        name: "FK_Dokumenty_Magazyny_MagazynId",
                        column: x => x.MagazynId,
                        principalTable: "Magazyny",
                        principalColumn: "IdMagazynu",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Dokumenty_Odbiorcy_OdbiorcaId",
                        column: x => x.OdbiorcaId,
                        principalTable: "Odbiorcy",
                        principalColumn: "IdOdbiorcy");
                    table.ForeignKey(
                        name: "FK_Dokumenty_Uzytkownicy_UzytkownikId",
                        column: x => x.UzytkownikId,
                        principalTable: "Uzytkownicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PozycjeDokumentow",
                columns: table => new
                {
                    IdPozycji = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ilosc = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    DokumentId = table.Column<int>(type: "int", nullable: false),
                    MaterialId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PozycjeDokumentow", x => x.IdPozycji);
                    table.ForeignKey(
                        name: "FK_PozycjeDokumentow_Dokumenty_DokumentId",
                        column: x => x.DokumentId,
                        principalTable: "Dokumenty",
                        principalColumn: "IdDokumentu",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PozycjeDokumentow_Materialy_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materialy",
                        principalColumn: "IdMaterialu",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RezerwacjeMaterialow",
                columns: table => new
                {
                    IdRezerwacji = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaterialId = table.Column<int>(type: "int", nullable: false),
                    MagazynId = table.Column<int>(type: "int", nullable: false),
                    DokumentId = table.Column<int>(type: "int", nullable: false),
                    ZarezerwowanaIlosc = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    DataRezerwacji = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RezerwacjeMaterialow", x => x.IdRezerwacji);
                    table.ForeignKey(
                        name: "FK_RezerwacjeMaterialow_Dokumenty_DokumentId",
                        column: x => x.DokumentId,
                        principalTable: "Dokumenty",
                        principalColumn: "IdDokumentu",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RezerwacjeMaterialow_Magazyny_MagazynId",
                        column: x => x.MagazynId,
                        principalTable: "Magazyny",
                        principalColumn: "IdMagazynu",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RezerwacjeMaterialow_Materialy_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materialy",
                        principalColumn: "IdMaterialu",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Dokumenty_DostawcaId",
                table: "Dokumenty",
                column: "DostawcaId");

            migrationBuilder.CreateIndex(
                name: "IX_Dokumenty_MagazynId",
                table: "Dokumenty",
                column: "MagazynId");

            migrationBuilder.CreateIndex(
                name: "IX_Dokumenty_OdbiorcaId",
                table: "Dokumenty",
                column: "OdbiorcaId");

            migrationBuilder.CreateIndex(
                name: "IX_Dokumenty_UzytkownikId",
                table: "Dokumenty",
                column: "UzytkownikId");

            migrationBuilder.CreateIndex(
                name: "IX_PozycjeDokumentow_DokumentId",
                table: "PozycjeDokumentow",
                column: "DokumentId");

            migrationBuilder.CreateIndex(
                name: "IX_PozycjeDokumentow_MaterialId",
                table: "PozycjeDokumentow",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_RezerwacjeMaterialow_DokumentId",
                table: "RezerwacjeMaterialow",
                column: "DokumentId");

            migrationBuilder.CreateIndex(
                name: "IX_RezerwacjeMaterialow_MagazynId",
                table: "RezerwacjeMaterialow",
                column: "MagazynId");

            migrationBuilder.CreateIndex(
                name: "IX_RezerwacjeMaterialow_MaterialId",
                table: "RezerwacjeMaterialow",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_StanyMagazynowe_MaterialId",
                table: "StanyMagazynowe",
                column: "MaterialId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogiBledow");

            migrationBuilder.DropTable(
                name: "PozycjeDokumentow");

            migrationBuilder.DropTable(
                name: "RezerwacjeMaterialow");

            migrationBuilder.DropTable(
                name: "StanyMagazynowe");

            migrationBuilder.DropTable(
                name: "Dokumenty");

            migrationBuilder.DropTable(
                name: "Materialy");

            migrationBuilder.DropTable(
                name: "Dostawcy");

            migrationBuilder.DropTable(
                name: "Magazyny");

            migrationBuilder.DropTable(
                name: "Odbiorcy");

            migrationBuilder.DropTable(
                name: "Uzytkownicy");
        }
    }
}
