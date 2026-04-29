using FarmHealthAPI.Data;
using FarmHealthAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmHealthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FarmController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FarmController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/farm/{userId}
        [HttpGet("{userId}")]
        public IActionResult GetFarm(int userId)
        {
            var farm = _context.Farms.FirstOrDefault(f => f.UserId == userId);
            if (farm == null)
                return NotFound();
            return Ok(farm);
        }

        // GET api/farm/user-risk/{userId}
        // Returns ALL risk points for the user
        [HttpGet("user-risk/{userId}")]
        public IActionResult GetUserFarmRisk(int userId)
        {
            var data = _context.FarmRiskView
                .Where(x => x.UserId == userId)
                .ToList();

            if (data.Count == 0)
                return NotFound();

            return Ok(data);
        }

        // GET api/farm/user-risk/{userId}/high
        // Returns ONLY high-risk points (Risk >= 60) for the user
        [HttpGet("user-risk/{userId}/high")]
        public IActionResult GetUserHighRisk(int userId)
        {
            var data = _context.FarmRiskView
                .Where(x => x.UserId == userId && x.Risk >= 60)
                .ToList();

            // Return empty array instead of 404 so frontend can handle it gracefully
            return Ok(data);
        }

        // POST api/farm
        [HttpPost]
        public IActionResult SaveFarm(Farm farm)
        {
            var existing = _context.Farms.FirstOrDefault(f => f.UserId == farm.UserId);
            if (existing != null)
            {
                existing.Name = farm.Name;
                existing.Polygon = farm.Polygon;
                existing.Latitude = farm.Latitude;
                existing.Longitude = farm.Longitude;
            }
            else
            {
                farm.CreatedAt = DateTime.Now;
                _context.Farms.Add(farm);
            }

            _context.SaveChanges();
            return Ok("Farm saved");
        }
    }
}