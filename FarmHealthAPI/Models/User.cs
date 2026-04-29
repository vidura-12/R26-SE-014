namespace FarmHealthAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;

        // Add the '?' to allow nulls from the database
        public string Email { get; set; } = string.Empty;
        public string? phone { get; set; }
        public string? address { get; set; }

        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
    }
}