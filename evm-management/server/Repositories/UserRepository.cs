using Dapper;
using EVMManagement.Api.Data;
using EVMManagement.Api.Models;

namespace EVMManagement.Api.Repositories;

public interface IUserRepository
{
    Task<User?> FindByUserCodeAsync(string userCode);
    Task<User?> FindByIdAsync(int userId);
    Task<int> CreateUserAsync(User user, string passwordHash);
    Task UpdateUserAsync(int userId, Dictionary<string, object?> fields);
    Task ToggleUserStatusAsync(int userId);
    Task<(List<User> Users, int Total)> ListUsersAsync(Dictionary<string, object?> filters, int page, int limit);
    Task StoreRefreshTokenAsync(int userId, string tokenHash, DateTime expiresAt, string? ipAddress);
    Task<RefreshToken?> FindRefreshTokenAsync(string tokenHash);
    Task RevokeRefreshTokenAsync(string tokenHash);
    Task RevokeAllUserTokensAsync(int userId);
    Task UpdateLastLoginAsync(int userId);
    Task IncrementFailedLoginAttemptsAsync(int userId);
}

public class UserRepository : IUserRepository
{
    private readonly DbConnectionFactory _db;

    public UserRepository(DbConnectionFactory db) => _db = db;

    public async Task<User?> FindByUserCodeAsync(string userCode)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            @"SELECT u.user_id AS UserId, u.user_code AS UserCode, u.password_hash AS PasswordHash,
                     u.full_name AS FullName, u.email AS Email, u.phone AS Phone, u.role AS Role,
                     u.state_id AS StateId, u.district_id AS DistrictId, u.user_type AS UserType,
                     u.valid_from AS ValidFrom, u.valid_until AS ValidUntil, u.is_active AS IsActive,
                     u.last_login AS LastLogin, u.failed_login_attempts AS FailedLoginAttempts,
                     u.locked_until AS LockedUntil, u.created_at AS CreatedAt, u.updated_at AS UpdatedAt,
                     s.state_name AS StateName, s.state_code AS StateCode,
                     d.district_name AS DistrictName, d.district_code AS DistrictCode
              FROM users u
              LEFT JOIN states s ON u.state_id = s.state_id
              LEFT JOIN districts d ON u.district_id = d.district_id
              WHERE u.user_code = @UserCode",
            new { UserCode = userCode });
    }

    public async Task<User?> FindByIdAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            @"SELECT u.user_id AS UserId, u.user_code AS UserCode, u.full_name AS FullName,
                     u.email AS Email, u.phone AS Phone, u.role AS Role, u.state_id AS StateId,
                     u.district_id AS DistrictId, u.user_type AS UserType, u.valid_from AS ValidFrom,
                     u.valid_until AS ValidUntil, u.is_active AS IsActive, u.last_login AS LastLogin,
                     u.failed_login_attempts AS FailedLoginAttempts, u.locked_until AS LockedUntil,
                     u.created_at AS CreatedAt, u.updated_at AS UpdatedAt,
                     s.state_name AS StateName, s.state_code AS StateCode,
                     d.district_name AS DistrictName, d.district_code AS DistrictCode
              FROM users u
              LEFT JOIN states s ON u.state_id = s.state_id
              LEFT JOIN districts d ON u.district_id = d.district_id
              WHERE u.user_id = @UserId",
            new { UserId = userId });
    }

    public async Task<int> CreateUserAsync(User user, string passwordHash)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO users (user_code, password_hash, full_name, email, phone, role,
                state_id, district_id, user_type, valid_from, valid_until, is_active, created_by)
              OUTPUT INSERTED.user_id
              VALUES (@UserCode, @PasswordHash, @FullName, @Email, @Phone, @Role,
                @StateId, @DistrictId, @UserType, @ValidFrom, @ValidUntil, 1, @CreatedBy)",
            new
            {
                user.UserCode, PasswordHash = passwordHash, user.FullName, user.Email, user.Phone,
                user.Role, user.StateId, user.DistrictId, user.UserType,
                user.ValidFrom, user.ValidUntil, user.CreatedBy
            });
    }

    public async Task UpdateUserAsync(int userId, Dictionary<string, object?> fields)
    {
        if (!fields.Any()) return;
        var setClauses = fields.Keys.Select(k => $"{k} = @{k}").ToList();
        setClauses.Add("updated_at = GETDATE()");
        var sql = $"UPDATE users SET {string.Join(", ", setClauses)} WHERE user_id = @UserId";
        var parameters = new DynamicParameters(fields);
        parameters.Add("UserId", userId);
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(sql, parameters);
    }

    public async Task ToggleUserStatusAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = GETDATE() WHERE user_id = @UserId",
            new { UserId = userId });
    }

    public async Task<(List<User> Users, int Total)> ListUsersAsync(Dictionary<string, object?> filters, int page, int limit)
    {
        var conditions = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        if (filters.TryGetValue("StateId", out var stateId) && stateId != null) { conditions.Add("u.state_id = @StateId"); parameters.Add("StateId", stateId); }
        if (filters.TryGetValue("DistrictId", out var districtId) && districtId != null) { conditions.Add("u.district_id = @DistrictId"); parameters.Add("DistrictId", districtId); }
        if (filters.TryGetValue("Role", out var role) && role != null) { conditions.Add("u.role = @Role"); parameters.Add("Role", role); }
        if (filters.TryGetValue("UserType", out var userType) && userType != null) { conditions.Add("u.user_type = @UserType"); parameters.Add("UserType", userType); }
        if (filters.TryGetValue("IsActive", out var isActive) && isActive != null) { conditions.Add("u.is_active = @IsActive"); parameters.Add("IsActive", isActive); }
        if (filters.TryGetValue("Search", out var search) && search != null) { conditions.Add("(u.full_name LIKE @Search OR u.user_code LIKE @Search)"); parameters.Add("Search", $"%{search}%"); }

        var where = string.Join(" AND ", conditions);
        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        using var conn = _db.CreateConnection();
        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM users u WHERE {where}", parameters);
        var users = (await conn.QueryAsync<User>(
            $@"SELECT u.user_id AS UserId, u.user_code AS UserCode, u.full_name AS FullName,
                      u.email AS Email, u.phone AS Phone, u.role AS Role, u.user_type AS UserType,
                      u.is_active AS IsActive, u.last_login AS LastLogin, u.valid_from AS ValidFrom,
                      u.valid_until AS ValidUntil, u.created_at AS CreatedAt, u.state_id AS StateId,
                      u.district_id AS DistrictId,
                      s.state_name AS StateName, d.district_name AS DistrictName
               FROM users u
               LEFT JOIN states s ON u.state_id = s.state_id
               LEFT JOIN districts d ON u.district_id = d.district_id
               WHERE {where}
               ORDER BY u.created_at DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters)).ToList();

        return (users, total);
    }

    public async Task StoreRefreshTokenAsync(int userId, string tokenHash, DateTime expiresAt, string? ipAddress)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address) VALUES (@UserId, @TokenHash, @ExpiresAt, @IpAddress)",
            new { UserId = userId, TokenHash = tokenHash, ExpiresAt = expiresAt, IpAddress = ipAddress?.Substring(0, Math.Min(50, ipAddress?.Length ?? 0)) });
    }

    public async Task<RefreshToken?> FindRefreshTokenAsync(string tokenHash)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<RefreshToken>(
            @"SELECT rt.token_id AS TokenId, rt.user_id AS UserId, rt.token_hash AS TokenHash,
                     rt.expires_at AS ExpiresAt, rt.is_revoked AS IsRevoked, rt.ip_address AS IpAddress,
                     rt.created_at AS CreatedAt
              FROM refresh_tokens rt
              JOIN users u ON rt.user_id = u.user_id
              WHERE rt.token_hash = @TokenHash AND rt.is_revoked = 0 AND rt.expires_at > GETDATE()",
            new { TokenHash = tokenHash });
    }

    public async Task RevokeRefreshTokenAsync(string tokenHash)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = @TokenHash", new { TokenHash = tokenHash });
    }

    public async Task RevokeAllUserTokensAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = @UserId", new { UserId = userId });
    }

    public async Task UpdateLastLoginAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE users SET last_login = GETDATE(), failed_login_attempts = 0, locked_until = NULL, updated_at = GETDATE() WHERE user_id = @UserId",
            new { UserId = userId });
    }

    public async Task IncrementFailedLoginAttemptsAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE users SET
                failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE WHEN failed_login_attempts + 1 >= 5 THEN DATEADD(MINUTE, 15, GETDATE()) ELSE locked_until END,
                updated_at = GETDATE()
              WHERE user_id = @UserId",
            new { UserId = userId });
    }
}
