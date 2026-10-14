using System.ComponentModel.DataAnnotations;
using CampusEats.Api.Data;
using CampusEats.Api.Dtos;
using CampusEats.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["ASPNETCORE_URLS"] ?? "http://0.0.0.0:8080");
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<CampusEatsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins("https://campuseats-dashboard-ten.vercel.app", "http://localhost:5173")
    .WithMethods("GET", "POST").WithHeaders("Content-Type")));

var app = builder.Build();
app.UseExceptionHandler();
app.UseCors();

if (builder.Configuration.GetValue<bool>("RUN_MIGRATIONS_ON_STARTUP"))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<CampusEatsDbContext>().Database.MigrateAsync();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/menu", async (CampusEatsDbContext db, CancellationToken ct) =>
    Results.Ok(await db.MenuItems.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct)));

app.MapPost("/api/orders", async (CreateOrderRequest request, CampusEatsDbContext db, CancellationToken ct) =>
{
    request.Name = request.Name?.Trim() ?? "";
    request.Email = request.Email?.Trim() ?? "";
    var validation = new List<ValidationResult>();
    if (!Validator.TryValidateObject(request, new ValidationContext(request), validation, true))
    {
        var errors = validation.SelectMany(result => result.MemberNames.Select(member =>
            new { member, message = result.ErrorMessage ?? "Invalid value." }))
            .GroupBy(x => x.member).ToDictionary(g => g.Key, g => g.Select(x => x.message).ToArray());
        return Results.ValidationProblem(errors);
    }
    var order = new Order { Name = request.Name, Email = request.Email, Qty = request.Qty };
    db.Orders.Add(order);
    await db.SaveChangesAsync(ct);
    return Results.Json(new { id = order.Id, message = "Order saved." }, statusCode: StatusCodes.Status201Created);
});

app.Run();
