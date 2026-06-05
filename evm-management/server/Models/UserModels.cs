namespace EVMManagement.Api.Models;

public class User
{
    public int UserId { get; set; }
    public string UserCode { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty; // ADMIN | STATE_OFFICER | DISTRICT_OFFICER
    public int? StateId { get; set; }
    public int? DistrictId { get; set; }
    public string UserType { get; set; } = "PERMANENT"; // PERMANENT | TEMPORARY
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLogin { get; set; }
    public int? CreatedBy { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockedUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Joined fields
    public string? StateName { get; set; }
    public string? StateCode { get; set; }
    public string? DistrictName { get; set; }
    public string? DistrictCode { get; set; }
}

public class State
{
    public int StateId { get; set; }
    public string StateCode { get; set; } = string.Empty;
    public string StateName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class District
{
    public int DistrictId { get; set; }
    public string DistrictCode { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public int StateId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class RefreshToken
{
    public int TokenId { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}
