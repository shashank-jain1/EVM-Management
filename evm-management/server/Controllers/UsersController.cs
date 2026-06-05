using EVMManagement.Api.DTOs;
using EVMManagement.Api.DTOs.Users;
using EVMManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EVMManagement.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService) => _userService = userService;

    private int CurrentUserId => int.Parse(User.FindFirst("userId")!.Value);
    private string CurrentRole => User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;

    /// <summary>GET /api/users — list with filters (admin only)</summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> List([FromQuery] UsersListFilter filter)
    {
        var (users, total) = await _userService.GetUsersAsync(filter);
        return Ok(ApiResponse<object>.Ok(users, pagination: new PaginationMeta
        {
            Page = filter.Page, Limit = filter.Limit, Total = total,
            TotalPages = (int)Math.Ceiling((double)total / filter.Limit)
        }));
    }

    /// <summary>GET /api/users/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        // Non-admin can only view their own profile
        if (CurrentRole != "ADMIN" && id != CurrentUserId)
            return Forbid();

        var user = await _userService.GetUserDetailAsync(id);
        return Ok(ApiResponse<object>.Ok(user));
    }

    /// <summary>POST /api/users — create user (admin only)</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var user = await _userService.CreateUserAsync(CurrentUserId, request, ip, ua);
        return Created($"/api/users/{user.UserId}", ApiResponse<object>.Ok(user, "User created successfully"));
    }

    /// <summary>PUT /api/users/{id} — update user (admin only)</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var user = await _userService.UpdateUserAsync(CurrentUserId, id, request, ip, ua);
        return Ok(ApiResponse<object>.Ok(user, "User updated successfully"));
    }

    /// <summary>PATCH /api/users/{id}/toggle-status — activate/deactivate (admin only)</summary>
    [HttpPatch("{id:int}/toggle-status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var user = await _userService.ToggleUserStatusAsync(CurrentUserId, id, ip, ua);
        return Ok(ApiResponse<object>.Ok(user, user.IsActive ? "User activated" : "User deactivated"));
    }
}
