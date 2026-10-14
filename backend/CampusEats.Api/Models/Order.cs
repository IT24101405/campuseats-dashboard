namespace CampusEats.Api.Models;

public class Order
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public int Qty { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
