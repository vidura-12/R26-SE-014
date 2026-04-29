namespace FarmHealthAPI.Data
{
    using FarmHealthAPI.Models;
    using Microsoft.EntityFrameworkCore;
    using System.Collections.Generic;

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Farm> Farms { get; set; }
        public DbSet<FarmRiskView> FarmRiskView { get; set; }
        public DbSet<FarmPixelData> FarmPixelData { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<FarmRiskView>()
                .HasNoKey()                // 👈 VERY IMPORTANT
                .ToView("vw_FarmRiskData"); // 👈 link to SQL view
        }
    }
}
