using Microsoft.EntityFrameworkCore;
using SystemMagazynu.Models;

namespace SystemMagazynu.Data;

public class MagazynDbContext : DbContext
{
	public MagazynDbContext(DbContextOptions<MagazynDbContext> options) : base(options) { }

	// Twoje tabele
	public DbSet<Material> Materialy { get; set; }
	public DbSet<Dostawca> Dostawcy { get; set; }
	public DbSet<Odbiorca> Odbiorcy { get; set; }
	public DbSet<Magazyn> Magazyny { get; set; }
	public DbSet<Dokument> Dokumenty { get; set; }
	public DbSet<PozycjaDokumentu> PozycjeDokumentow { get; set; }
	public DbSet<StanMagazynowy> StanyMagazynowe { get; set; }
	public DbSet<Uzytkownik> Uzytkownicy { get; set; }
    public DbSet<RezerwacjaMaterialu> RezerwacjeMaterialow { get; set; }
    public DbSet<LogBledu> LogiBledow { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		// Klucze g³ówne
		modelBuilder.Entity<Material>().HasKey(m => m.IdMaterialu);
		modelBuilder.Entity<Dostawca>().HasKey(d => d.IdDostawcy);
		modelBuilder.Entity<Odbiorca>().HasKey(o => o.IdOdbiorcy);
		modelBuilder.Entity<Magazyn>().HasKey(m => m.IdMagazynu);
		modelBuilder.Entity<Dokument>().HasKey(d => d.IdDokumentu);
		modelBuilder.Entity<PozycjaDokumentu>().HasKey(p => p.IdPozycji);
		modelBuilder.Entity<Uzytkownik>().HasKey(u => u.Id);
        modelBuilder.Entity<RezerwacjaMaterialu>().HasKey(r => r.IdRezerwacji);

        // Klucz z³o¿ony dla StanMagazynowy
        modelBuilder.Entity<StanMagazynowy>()
			.HasKey(s => new { s.MagazynId, s.MaterialId });

		// KONFIGURACJA PÓL DECIMAL - DODAJ TE LINIJKI:
		modelBuilder.Entity<PozycjaDokumentu>()
			.Property(p => p.Ilosc)
			.HasPrecision(10, 2); // 10 cyfr, 2 po przecinku

		modelBuilder.Entity<StanMagazynowy>()
			.Property(s => s.Ilosc)
			.HasPrecision(10, 2); // 10 cyfr, 2 po przecinku

        modelBuilder.Entity<Dokument>(entity =>
        {
            entity.ToTable("Dokumenty");
            
        });

        modelBuilder.Entity<PozycjaDokumentu>(entity =>
        {
            entity.ToTable("PozycjeDokumentow");
            
        });

        // Relacje
        modelBuilder.Entity<Dokument>()
			.HasOne(d => d.Dostawca)
			.WithMany(d => d.Dokumenty)
			.HasForeignKey(d => d.DostawcaId);

		modelBuilder.Entity<Dokument>()
			.HasOne(d => d.Odbiorca)
			.WithMany(o => o.Dokumenty)
			.HasForeignKey(d => d.OdbiorcaId);

		modelBuilder.Entity<Dokument>()
			.HasOne(d => d.Magazyn)
			.WithMany(m => m.Dokumenty)
			.HasForeignKey(d => d.MagazynId);

		modelBuilder.Entity<PozycjaDokumentu>()
			.HasOne(p => p.Dokument)
			.WithMany(d => d.Pozycje)
			.HasForeignKey(p => p.DokumentId);

		modelBuilder.Entity<PozycjaDokumentu>()
			.HasOne(p => p.Material)
			.WithMany(m => m.PozycjeDokumentow)
			.HasForeignKey(p => p.MaterialId);

		modelBuilder.Entity<StanMagazynowy>()
			.HasOne(s => s.Magazyn)
			.WithMany(m => m.StanyMagazynowe)
			.HasForeignKey(s => s.MagazynId);

		modelBuilder.Entity<StanMagazynowy>()
			.HasOne(s => s.Material)
			.WithMany(m => m.StanyMagazynowe)
			.HasForeignKey(s => s.MaterialId);
		modelBuilder.Entity<Dokument>()
			.HasOne(d => d.Uzytkownik)
			.WithMany(u => u.Dokumenty)
			.HasForeignKey(d => d.UzytkownikId);
        modelBuilder.Entity<Uzytkownik>()
        .Property(u => u.Rola)
        .HasConversion<string>()  // Zamienia enum na string w bazie mozna usunac chyba?
        .IsRequired(false);

        modelBuilder.Entity<RezerwacjaMaterialu>(entity =>
        {
            entity.HasKey(r => r.IdRezerwacji);

            entity.HasOne(r => r.Material)
                  .WithMany()
                  .HasForeignKey(r => r.MaterialId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Magazyn)
                  .WithMany()
                  .HasForeignKey(r => r.MagazynId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Dokument)
                  .WithMany()
                  .HasForeignKey(r => r.DokumentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(r => r.ZarezerwowanaIlosc)
                  .HasPrecision(10, 2);
        });
    }
}