namespace FarmHealthAPI.Models
{
    public class Farm
    {
        public int FarmId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Polygon { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
