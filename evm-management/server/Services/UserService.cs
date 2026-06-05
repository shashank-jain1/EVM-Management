using BCrypt.Net;
using EVMManagement.Api.DTOs.Users;
using EVMManagement.Api.Models;
using EVMManagement.Api.Repositories;
using EVMManagement.Api.Utils;

namespace EVMManagement.Api.Services;

public interface IUserService
{
    Task<User> CreateUserAsync(int adminId, CreateUserRequest request, string? ipAddress, string? userAgent);
    Task<User> UpdateUserAsync(int adminId, int userId, UpdateUserRequest request, string? ipAddress, string? userAgent);
    Task<User> ToggleUserStatusAsync(int adminId, int userId, string? ipAddress, string? userAgent);
    Task<(List<User> Users, int Total)> GetUsersAsync(UsersListFilter filter);
    Task<User> GetUserDetailAsync(int userId);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepo;
    private readonly IAuditLogger _audit;

    public UserService(IUserRepository userRepo, IAuditLogger audit)
    {
        _userRepo = userRepo;
        _audit = audit;
    }

    public async Task<User> CreateUserAsync(int adminId, CreateUserRequest request, string? ipAddress, string? userAgent)
    {
        var existing = await _userRepo.FindByUserCodeAsync(request.UserCode);
        if (existing != null) throw new ConflictException("User code already exists");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);
        var user = new User
        {
            UserCode = request.UserCode,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Role = request.Role,
            StateId = request.StateId,
            DistrictId = request.DistrictId,
            UserType = request.UserType,
            ValidFrom = request.ValidFrom,
            ValidUntil = request.ValidUntil,
            CreatedBy = adminId,
        };

        var userId = await _userRepo.CreateUserAsync(user, passwordHash);
        var created = await _userRepo.FindByIdAsync(userId);

        await _audit.LogAsync(adminId, "USER_CREATED", "USER", userId.ToString(),
            null, new { request.UserCode, request.Role }, ipAddress, userAgent);

        return created!;
    }

    public async Task<User> UpdateUserAsync(int adminId, int userId, UpdateUserRequest request, string? ipAddress, string? userAgent)
    {
        var user = await _userRepo.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found");

        var fields = new Dictionary<string, object?>();
        if (request.FullName != null) fields["full_name"] = request.FullName;
        if (request.Email != null) fields["email"] = request.Email;
        if (request.Phone != null) fields["phone"] = request.Phone;
        if (request.StateId.HasValue) fields["state_id"] = request.StateId;
        if (request.DistrictId.HasValue) fields["district_id"] = request.DistrictId;
        if (request.UserType != null) fields["user_type"] = request.UserType;
        if (request.ValidFrom.HasValue) fields["valid_from"] = request.ValidFrom;
        if (request.ValidUntil.HasValue) fields["valid_until"] = request.ValidUntil;
        if (!string.IsNullOrEmpty(request.Password))
            fields["password_hash"] = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);

        var oldValues = new { user.FullName, user.Email, user.IsActive };
        await _userRepo.UpdateUserAsync(userId, fields);
        await _audit.LogAsync(adminId, "USER_UPDATED", "USER", userId.ToString(), oldValues, request, ipAddress, userAgent);

        return (await _userRepo.FindByIdAsync(userId))!;
    }

    public async Task<User> ToggleUserStatusAsync(int adminId, int userId, string? ipAddress, string? userAgent)
    {
        if (adminId == userId) throw new BusinessException("Cannot deactivate your own account", "SELF_DEACTIVATION");

        var user = await _userRepo.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found");

        await _userRepo.ToggleUserStatusAsync(userId);
        var updated = (await _userRepo.FindByIdAsync(userId))!;

        await _audit.LogAsync(adminId, updated.IsActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", "USER",
            userId.ToString(), new { IsActive = user.IsActive }, new { IsActive = updated.IsActive }, ipAddress, userAgent);

        return updated;
    }

    public async Task<(List<User> Users, int Total)> GetUsersAsync(UsersListFilter filter)
    {
        var filters = new Dictionary<string, object?>();
        if (filter.StateId.HasValue) filters["StateId"] = filter.StateId;
        if (filter.DistrictId.HasValue) filters["DistrictId"] = filter.DistrictId;
        if (!string.IsNullOrEmpty(filter.Role)) filters["Role"] = filter.Role;
        if (!string.IsNullOrEmpty(filter.UserType)) filters["UserType"] = filter.UserType;
        if (filter.IsActive.HasValue) filters["IsActive"] = filter.IsActive.Value ? 1 : 0;
        if (!string.IsNullOrEmpty(filter.Search)) filters["Search"] = filter.Search;

        return await _userRepo.ListUsersAsync(filters, filter.Page, filter.Limit);
    }

    public async Task<User> GetUserDetailAsync(int userId)
    {
        var user = await _userRepo.FindByIdAsync(userId)
            ?? throw new NotFoundException("User not found");
        // Remove sensitive fields before returning
        user.PasswordHash = string.Empty;
        return user;
    }
}
