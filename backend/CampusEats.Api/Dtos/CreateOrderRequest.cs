using System.ComponentModel.DataAnnotations;

namespace CampusEats.Api.Dtos;

public class CreateOrderRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [Required, StringLength(254), EmailAddress]
    [RegularExpression(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    public string Email { get; set; } = "";

    [Range(1, int.MaxValue)]
    public int Qty { get; set; }
}
