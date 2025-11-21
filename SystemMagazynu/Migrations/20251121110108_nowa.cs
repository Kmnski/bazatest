using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SystemMagazynu.Migrations
{
    /// <inheritdoc />
    public partial class nowa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. PROCEDURY WYSZUKIWANIA
            migrationBuilder.Sql(File.ReadAllText("SearchDostawcy.sql"));
            migrationBuilder.Sql(File.ReadAllText("SearchOdbiorcy.sql"));

            // 2. FUNKCJE STATYSTYK
            migrationBuilder.Sql(File.ReadAllText("PobierzStatystykiMaterialow.sql"));
            migrationBuilder.Sql(File.ReadAllText("PobierzStatystykIDashboard.sql"));
            migrationBuilder.Sql(File.ReadAllText("PobierzOstatniaAktywnosc.sql"));

            // 3. TRIGGERY
            migrationBuilder.Sql(File.ReadAllText("DokumentPoAkceptacji.sql"));
            migrationBuilder.Sql(File.ReadAllText("DokumentPoOdrzuceniu.sql"));
            migrationBuilder.Sql(File.ReadAllText("RezerwacjaPoDodaniu.sql"));

            // 4. DANE - TYLKO JEŚLI TABELE SĄ PUSTE
            migrationBuilder.Sql(@"
                -- Dodawanie danych tylko jeśli tabele są puste
                IF NOT EXISTS (SELECT 1 FROM Uzytkownicy)
                BEGIN
                    " + File.ReadAllText("DANE.sql") + @"
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Usuwanie w odwrotnej kolejności
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS DokumentPoAkceptacji");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS DokumentPoOdrzuceniu");

            migrationBuilder.Sql("DROP FUNCTION IF EXISTS PobierzStatystykiMaterialow");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS PobierzStatystykIDashboard");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS PobierzOstatniaAktywnosc");

            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_SearchDostawcy");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_SearchOdbiorcy");

            migrationBuilder.Sql("DROP TRIGGER IF EXISTS DokumentPoOdrzuceniu;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS DokumentPoAkceptacji");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS RezerwacjaPoDodaniu");


            migrationBuilder.Sql(@"
        DELETE FROM StanyMagazynowe;
        DELETE FROM PozycjeDokumentow;
        DELETE FROM RezerwacjeMaterialow;
        DELETE FROM Dokumenty;
        DELETE FROM Materialy;
        DELETE FROM Magazyny;
        DELETE FROM Odbiorcy;
        DELETE FROM Dostawcy;
        DELETE FROM Uzytkownicy;
    ");
        }
    }
}
