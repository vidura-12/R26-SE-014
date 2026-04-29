using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
namespace FarmHealthAPI.Controllers
{
    using FarmHealthAPI.Data;
    using FarmHealthAPI.Models;
    using Microsoft.AspNetCore.Mvc;
    using System.Security.Cryptography;
    using System.Text;

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        [HttpPost("signup")]
        public IActionResult Signup(User newUser)
        {
            // 1. Check if Username or Email already exists
            bool exists = _context.Users.Any(u => u.Username == newUser.Username || u.Email == newUser.Email);

            if (exists)
            {
                return BadRequest("Username or Email is already registered.");
            }

            // 2. Hash password and save
            newUser.PasswordHash = HashPassword(newUser.PasswordHash);
            _context.Users.Add(newUser);
            _context.SaveChanges();

            return Ok("Account created successfully!");
        }
        [HttpPost("login")]
        public IActionResult Login([FromBody] User login)
        {
            var hashed = HashPassword(login.PasswordHash);

            var user = _context.Users
                .FirstOrDefault(u => u.Email.ToLower() == login.Username.ToLower() && u.PasswordHash == hashed);

            if (user == null)
            {
                return Unauthorized("Invalid credentials");
            }
            var claims = new[]
            {
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Role, user.Role)
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "FarmAPI",
                audience: "FarmUsers",
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user = user.Username,
                role = user.Role,
                userId = user.Id 
            });
        }
    }
}
