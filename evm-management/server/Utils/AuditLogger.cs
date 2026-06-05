using Dapper;
using EVMManagement.Api.Data;

namespace EVMManagement.Api.Utils;

public interface IAuditLogger
{
    Task LogAsync(int? userId, string action, string? entityType, string? entityId, object? oldValues, object? newValues, string? ipAddress, string? userAgent);
}

public class AuditLogger : IAuditLogger
{
    private readonly DbConnectionFactory _db;
    private readonly ILogger<AuditLogger> _logger;

    public AuditLogger(DbConnectionFactory db, ILogger<AuditLogger> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task LogAsync(int? userId, string action, string? entityType, string? entityId, object? oldValues, object? newValues, string? ipAddress, string? userAgent)
    {
        try
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                @"INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
                  VALUES (@UserId, @Action, @EntityType, @EntityId, @OldValues, @NewValues, @IpAddress, @UserAgent)",
                new
                {
                    UserId = userId,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entityId,
                    OldValues = oldValues != null ? System.Text.Json.JsonSerializer.Serialize(oldValues) : null,
                    NewValues = newValues != null ? System.Text.Json.JsonSerializer.Serialize(newValues) : null,
                    IpAddress = ipAddress?.Substring(0, Math.Min(50, ipAddress?.Length ?? 0)),
                    UserAgent = userAgent?.Substring(0, Math.Min(500, userAgent?.Length ?? 0)),
                });
        }
        catch (Exception ex)
        {
            // Audit log failure must NOT break the main flow
            _logger.LogError(ex, "Audit log failed for action {Action}", action);
        }
    }
}
