namespace SystemMagazynu.DTOs
{
    public class DokumentCreateDto
    {
        public string Typ { get; set; } = string.Empty;
        public DateTime Data { get; set; }
        public string Status { get; set; } = "oczekuj¹cy";
        public string NumerDokumentu { get; set; } = string.Empty;
        public int? DostawcaId { get; set; }
        public int? OdbiorcaId { get; set; }
        public int MagazynId { get; set; }
        public int UzytkownikId { get; set; }
        public List<PozycjaDokumentuCreateDto> Pozycje { get; set; } = new List<PozycjaDokumentuCreateDto>();
    }



    public class PozycjaDokumentuCreateDto
    {
        public decimal Ilosc { get; set; }
        public int MaterialId { get; set; }
    }

    public class DokumentResponseDto
    {
        public int IdDokumentu { get; set; }
        public string Typ { get; set; } = string.Empty;
        public DateTime Data { get; set; }
        public string Status { get; set; } = string.Empty;
        public string NumerDokumentu { get; set; } = string.Empty;
        public int? DostawcaId { get; set; }
        public string DostawcaNazwa { get; set; } = string.Empty;
        public int? OdbiorcaId { get; set; }
        public string OdbiorcaNazwa { get; set; } = string.Empty;
        public int MagazynId { get; set; }
        public string MagazynLokalizacja { get; set; } = string.Empty;
        public int UzytkownikId { get; set; }
        public string UzytkownikEmail { get; set; } = string.Empty;
        public List<PozycjaResponseDto> Pozycje { get; set; } = new List<PozycjaResponseDto>();
    }

    public class PozycjaResponseDto
    {
        public int IdPozycji { get; set; }
        public decimal Ilosc { get; set; }
        public int MaterialId { get; set; }
        public string MaterialNazwa { get; set; } = string.Empty;
        
        public string MaterialJednostka { get; set; } = string.Empty;
    }

    public class DokumentListDto
    {
        public int IdDokumentu { get; set; }
        public string Typ { get; set; } = string.Empty;
        public DateTime Data { get; set; }
        public string Status { get; set; } = string.Empty;
        public string NumerDokumentu { get; set; } = string.Empty;
        public string DostawcaNazwa { get; set; } = string.Empty;
        public string OdbiorcaNazwa { get; set; } = string.Empty;
        public string MagazynLokalizacja { get; set; } = string.Empty;
        public string UzytkownikEmail { get; set; } = string.Empty;
        public int LiczbaPozycji { get; set; }
    }

    public class DokumentUpdateDto
    {
        
        public string Typ { get; set; } = string.Empty;
        public DateTime Data { get; set; }
        public string Status { get; set; } = "oczekuj¹cy";
        public string NumerDokumentu { get; set; } = string.Empty;
        public int? DostawcaId { get; set; }
        public int? OdbiorcaId { get; set; }
        public int MagazynId { get; set; }
        public List<PozycjaDokumentuCreateDto> Pozycje { get; set; } = new List<PozycjaDokumentuCreateDto>();
    }
    
    public class RejectDocumentDto
    {
        public string Reason { get; set; } = string.Empty;
    }


}