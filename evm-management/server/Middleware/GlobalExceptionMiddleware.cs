using EVMManagement.Api.DTOs;
using EVMManagement.Api.Services;
using System.Text.Json;

namespace EVMManagement.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, errorCode, message) = exception switch
        {
            UnauthorizedException e  => (401, e.ErrorCode, e.Message),
            ForbiddenException e     => (403, "FORBIDDEN", e.Message),
            NotFoundException e      => (404, "NOT_FOUND", e.Message),
            ConflictException e      => (409, "CONFLICT", e.Message),
            BusinessException e      => (422, e.ErrorCode, e.Message),
            _                        => (500, "INTERNAL_ERROR", "An unexpected error occurred"),
        };

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new ApiErrorResponse
        {
            Error = new ApiError
            {
                Code = errorCode,
                Message = _env.IsDevelopment() && statusCode >= 500 ? exception.Message : message,
            }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
