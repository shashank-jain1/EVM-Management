using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace EVMManagement.Api.Utils;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string RefreshSecret { get; set; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; set; } = 30;
    public int RefreshTokenExpiryDays { get; set; } = 7;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
}

public class TokenPair
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class JwtHelper
{
    private readonly JwtSettings _settings;

    public JwtHelper(JwtSettings settings) => _settings = settings;

    public TokenPair GenerateTokens(int userId, string role, int? stateId, int? districtId)
    {
        return new TokenPair
        {
            AccessToken = GenerateToken(userId, role, stateId, districtId, _settings.Secret, _settings.AccessTokenExpiryMinutes),
            RefreshToken = GenerateToken(userId, role, stateId, districtId, _settings.RefreshSecret, _settings.RefreshTokenExpiryDays * 60 * 24),
        };
    }

    private string GenerateToken(int userId, string role, int? stateId, int? districtId, string secret, int expiryMinutes)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new("userId", userId.ToString()),
            new(ClaimTypes.Role, role),
        };
        if (stateId.HasValue) claims.Add(new("stateId", stateId.Value.ToString()));
        if (districtId.HasValue) claims.Add(new("districtId", districtId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateRefreshToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_settings.RefreshSecret);
        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _settings.Issuer,
                ValidateAudience = true,
                ValidAudience = _settings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            }, out _);
            return principal;
        }
        catch { return null; }
    }

    public static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLower();
    }

    public static (int UserId, string Role, int? StateId, int? DistrictId) ExtractClaims(ClaimsPrincipal principal)
    {
        var userId = int.Parse(principal.FindFirstValue("userId")!);
        var role = principal.FindFirstValue(ClaimTypes.Role)!;
        var stateId = principal.FindFirstValue("stateId") is { } s ? int.Parse(s) : (int?)null;
        var districtId = principal.FindFirstValue("districtId") is { } d ? int.Parse(d) : (int?)null;
        return (userId, role, stateId, districtId);
    }
}
