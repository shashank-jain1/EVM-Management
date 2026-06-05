using System.Text;
using AspNetCoreRateLimit;
using EVMManagement.Api.Data;
using EVMManagement.Api.Middleware;
using EVMManagement.Api.Repositories;
using EVMManagement.Api.Services;
using EVMManagement.Api.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;

// ─────────────────────────────────────────────
// Bootstrap Serilog before host is built
// ─────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console(outputTemplate: "{Timestamp:HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
    var builder = WebApplication.CreateBuilder(args);

    // ─────────────────────────────────────────────
    // Serilog
    // ─────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, config) =>
    {
        config
            .ReadFrom.Configuration(ctx.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console(outputTemplate: "{Timestamp:HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}");

        if (!ctx.HostingEnvironment.IsDevelopment())
            config.WriteTo.File("logs/evm-.log", rollingInterval: RollingInterval.Day);
    });

    // ─────────────────────────────────────────────
    // JWT Settings
    // ─────────────────────────────────────────────
    var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
        ?? throw new InvalidOperationException("JwtSettings not configured");
    builder.Services.AddSingleton(jwtSettings);
    builder.Services.AddSingleton<JwtHelper>();

    // ─────────────────────────────────────────────
    // Authentication / JWT Bearer
    // ─────────────────────────────────────────────
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            };
        });
    builder.Services.AddAuthorization();

    // ─────────────────────────────────────────────
    // CORS
    // ─────────────────────────────────────────────
    var clientUrl = builder.Configuration["ClientUrl"] ?? "http://localhost:5173";
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("EVMPolicy", policy =>
            policy
                .WithOrigins(clientUrl, "https://markers-rows-associated-paul.trycloudflare.com")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials());
    });

    // ─────────────────────────────────────────────
    // Rate Limiting
    // ─────────────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

    // ─────────────────────────────────────────────
    // Database
    // ─────────────────────────────────────────────
    builder.Services.AddSingleton<DbConnectionFactory>();

    // ─────────────────────────────────────────────
    // Repositories & Services
    // ─────────────────────────────────────────────
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IEvmRepository, EvmRepository>();
    builder.Services.AddScoped<IDispatchRepository, DispatchRepository>();

    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IEvmService, EvmService>();
    builder.Services.AddScoped<IDispatchService, DispatchService>();

    builder.Services.AddSingleton<IAuditLogger, AuditLogger>();

    // ─────────────────────────────────────────────
    // Controllers + JSON
    // ─────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });

    // ─────────────────────────────────────────────
    // Swagger
    // ─────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "EVM Management API", Version = "v1", Description = "Government of India — EVM Management System" });
        c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "JWT Authorization header using the Bearer scheme.",
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
        });
        c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // ─────────────────────────────────────────────
    // Build App
    // ─────────────────────────────────────────────
    var app = builder.Build();

    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "EVM Management API v1");
            c.RoutePrefix = "swagger";
        });
    }

    // Security headers
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        if (!app.Environment.IsDevelopment())
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        await next();
    });

    app.UseIpRateLimiting();
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseCors("EVMPolicy");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // Health check endpoint
    app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }));

    // Seeding database
    using (var scope = app.Services.CreateScope())
    {
        var factory = scope.ServiceProvider.GetRequiredService<DbConnectionFactory>();
        using var conn = factory.CreateConnection();
        await DbSeeder.SeedStatesAndDistrictsAsync(conn);
    }

    Log.Information("🏛️ EVM Management API starting on {Env}", app.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
