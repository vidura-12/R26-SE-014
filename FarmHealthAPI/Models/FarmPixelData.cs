using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmHealthAPI.Models
{
    [Table("FarmPixelData")]
    public class FarmPixelData
    {
        [Key]
        public int Id { get; set; }

        public int FarmId { get; set; }

        public DateTime Date { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public double? NDVI { get; set; }

        public double? NDMI { get; set; }

        public double? NDVI_Min { get; set; }

        public double? NDVI_Max { get; set; }

        public double? NDMI_Min { get; set; }

        public double? NDMI_Max { get; set; }

        public int? PixelCount { get; set; }

        public double Risk { get; set; }

        public string CellId { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}