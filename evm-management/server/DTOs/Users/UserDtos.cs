namespace EVMManagement.Api.DTOs.Users;

public class CreateUserRequest
{
    public string UserCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public int StateId { get; set; }
    public int? DistrictId { get; set; }
    public string UserType { get; set; } = "PERMANENT";
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int? StateId { get; set; }
    public int? DistrictId { get; set; }
    public string? UserType { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public string? Password { get; set; }
    public string? ConfirmPassword { get; set; }
}

public class UserResponse
{
    public int UserId { get; set; }
    public string UserCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public int? DistrictId { get; set; }
    public string? DistrictName { get; set; }
    public string UserType { get; set; } = string.Empty;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UsersListFilter
{
    public int? StateId { get; set; }
    public int? DistrictId { get; set; }
    public string? Role { get; set; }
    public string? UserType { get; set; }
    public bool? IsActive { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}
