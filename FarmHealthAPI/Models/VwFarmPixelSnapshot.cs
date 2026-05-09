namespace FarmHealthAPI.Models
{
    public class VwFarmPixelSnapshot
    {
        public int Id { get; set; }
        public int FarmId { get; set; }
        public DateTime CaptureDate { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Risk { get; set; }
        public double? NDVI { get; set; }
        public double? NDMI { get; set; }
        public string? CellId { get; set; }
        public int? PixelCount { get; set; }
    }
}
