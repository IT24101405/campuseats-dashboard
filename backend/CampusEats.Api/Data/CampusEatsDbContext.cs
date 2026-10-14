using CampusEats.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CampusEats.Api.Data;

public class CampusEatsDbContext(DbContextOptions<CampusEatsDbContext> options) : DbContext(options)
{
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Price).HasPrecision(10, 2);
            // Original public/menu.json values. Applied once by the initial migration.
            entity.HasData(
                new MenuItem { Id = 1, Name = "Kottu Roti", Price = 750, Category = "Mains", Available = true },
                new MenuItem { Id = 2, Name = "Fried Rice", Price = 850, Category = "Mains", Available = true },
                new MenuItem { Id = 3, Name = "Veg Sub", Price = 600, Category = "Snacks", Available = false },
                new MenuItem { Id = 4, Name = "Watalappan", Price = 350, Category = "Dessert", Available = true },
                new MenuItem { Id = 5, Name = "Iced Milo", Price = 300, Category = "Drinks", Available = true });
        });
        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(254).IsRequired();
            entity.ToTable(t => t.HasCheckConstraint("CK_Orders_Qty", "\"Qty\" >= 1"));
        });
    }
}
