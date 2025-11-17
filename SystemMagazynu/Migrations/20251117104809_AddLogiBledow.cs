using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SystemMagazynu.Migrations
{
    /// <inheritdoc />
    public partial class AddLogiBledow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogiBledow");
        }
    }
}
