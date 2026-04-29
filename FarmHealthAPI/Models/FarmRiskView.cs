namespace FarmHealthAPI.Models
{
    public class FarmRiskView
    {
        public int Id { get; set; }
        public int FarmId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? NDVI { get; set; }
        public double? NDMI { get; set; }
        public double? Risk { get; set; }
        public DateTime Date { get; set; }
        public int UserId { get; set; }
        public string CellId { get; set; }
    }
}
