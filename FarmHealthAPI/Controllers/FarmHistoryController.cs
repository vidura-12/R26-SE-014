using FarmHealthAPI.Data;
using FarmHealthAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmHealthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FarmHistoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FarmHistoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/farmhistory/{farmId}/dates
        [HttpGet("{farmId}/dates")]
        public IActionResult GetFarmDates(int farmId)
        {
            var dates = _context.FarmPixelData
                .Where(x => x.FarmId == farmId)
                .Select(x => x.Date.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList()
                .Select(d => d.ToString("yyyy-MM-dd"))
                .ToList();

            if (!dates.Any())
                return NotFound(new { message = "No data found for this farm." });

            return Ok(dates);
        }

        // GET api/farmhistory/{farmId}/pixels?date=2026-03-10
        [HttpGet("{farmId}/pixels")]
        public IActionResult GetFarmPixelsByDate(int farmId, [FromQuery] string date)
        {
            if (string.IsNullOrWhiteSpace(date))
                return BadRequest(new { message = "date query parameter is required. Format: YYYY-MM-DD" });

            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });

            var targetDate = parsedDate.Date;

            var pixels = _context.FarmPixelData
                .Where(x => x.FarmId == farmId && x.Date.Date == targetDate)
                .Select(x => new
                {
                    x.Id,
                    x.FarmId,
                    x.CellId,
                    Date = x.Date.ToString(),
                    x.Latitude,
                    x.Longitude,
                    x.NDVI,
                    x.NDMI,
                    x.NDVI_Min,
                    x.NDVI_Max,
                    x.NDMI_Min,
                    x.NDMI_Max,
                    x.PixelCount,
                    x.Risk,
                    x.CreatedAt
                })
                .ToList();

            if (!pixels.Any())
                return NotFound(new { message = $"No pixel data found for farm {farmId} on {date}." });

            var summary = new
            {
                FarmId = farmId,
                Date = date,
                TotalCells = pixels.Count,
                HighRisk = pixels.Count(p => p.Risk >= 60),
                MediumRisk = pixels.Count(p => p.Risk >= 30 && p.Risk < 60),
                LowRisk = pixels.Count(p => p.Risk < 30),
                AvgRisk = Math.Round(pixels.Average(p => p.Risk), 2),
                MaxRisk = pixels.Max(p => p.Risk),
                AvgNDVI = Math.Round(pixels.Average(p => p.NDVI ?? 0), 4),
                AvgNDMI = Math.Round(pixels.Average(p => p.NDMI ?? 0), 4),
                Pixels = pixels
            };

            return Ok(summary);
        }
    }
}