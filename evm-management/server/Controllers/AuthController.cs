using EVMManagement.Api.DTOs;
using EVMManagement.Api.DTOs.Auth;
using EVMManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EVMManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>POST /api/auth/login</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _authService.LoginAsync(request.UserCode, request.Password, ipAddress, userAgent);
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful"));
    }

    /// <summary>POST /api/auth/refresh</summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.RefreshAsync(request.RefreshToken, ipAddress);
        return Ok(ApiResponse<RefreshResponse>.Ok(result));
    }

    /// <summary>POST /api/auth/logout</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        await _authService.LogoutAsync(request.RefreshToken, userId, ipAddress, userAgent);
        return Ok(ApiResponse<object>.Ok(null!, "Logged out successfully"));
    }

    /// <summary>GET /api/auth/me</summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var userId = User.FindFirst("userId")?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var stateId = User.FindFirst("stateId")?.Value;
        var districtId = User.FindFirst("districtId")?.Value;

        return Ok(ApiResponse<object>.Ok(new
        {
            UserId = userId,
            Role = role,
            StateId = stateId,
            DistrictId = districtId,
        }));
    }
}
