using EVMManagement.Api.DTOs;
using EVMManagement.Api.DTOs.Evm;
using EVMManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EVMManagement.Api.Controllers;

[ApiController]
[Route("api/evm")]
[Authorize]
public class EvmController : ControllerBase
{
    private readonly IEvmService _evmService;

    public EvmController(IEvmService evmService) => _evmService = evmService;

    private int CurrentUserId => int.Parse(User.FindFirst("userId")!.Value);
    private int? CurrentStateId => User.FindFirst("stateId") is { } c ? int.Parse(c.Value) : null;
    private int? CurrentDistrictId => User.FindFirst("districtId") is { } c ? int.Parse(c.Value) : null;

    /// <summary>GET /api/evm — paginated list with filters</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] EvmListFilter filter)
    {
        if (!User.IsInRole("ADMIN"))
        {
            if (User.IsInRole("DISTRICT_OFFICER"))
            {
                filter.StateId = CurrentStateId;
                filter.DistrictId = CurrentDistrictId;
            }
            else if (User.IsInRole("STATE_OFFICER"))
            {
                filter.StateId = CurrentStateId;
            }
        }

        var (units, total) = await _evmService.ListUnitsAsync(filter);
        return Ok(ApiResponse<object>.Ok(units, pagination: new PaginationMeta
        {
            Page = filter.Page, Limit = filter.Limit, Total = total,
            TotalPages = (int)Math.Ceiling((double)total / filter.Limit)
        }));
    }

    /// <summary>GET /api/evm/lookup/{code} — lookup by barcode/QR code</summary>
    [HttpGet("lookup/{code}")]
    public async Task<IActionResult> Lookup(string code)
    {
        var unit = await _evmService.LookupByCodeAsync(code);
        if (unit == null) return NotFound(new ApiErrorResponse { Error = new ApiError { Code = "NOT_FOUND", Message = $"EVM unit '{code}' not found" } });
        return Ok(ApiResponse<object>.Ok(unit));
    }

    /// <summary>GET /api/evm/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var unit = await _evmService.GetUnitDetailAsync(id);
        return Ok(ApiResponse<object>.Ok(unit));
    }

    /// <summary>GET /api/evm/{id}/history — full movement history</summary>
    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        var history = await _evmService.GetUnitHistoryAsync(id);
        return Ok(ApiResponse<object>.Ok(history));
    }

    /// <summary>POST /api/evm — register new EVM unit (admin only)</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,STATE_OFFICER,DISTRICT_OFFICER")]
    public async Task<IActionResult> Register([FromBody] CreateEvmRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var unit = await _evmService.RegisterUnitAsync(CurrentUserId, request, ip, ua);
        return Created($"/api/evm/{unit.UnitId}", ApiResponse<object>.Ok(unit, "EVM unit registered successfully"));
    }

    /// <summary>PATCH /api/evm/{id}/status — update status (admin/state officer)</summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "ADMIN,STATE_OFFICER")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateEvmStatusRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var unit = await _evmService.UpdateStatusAsync(CurrentUserId, id, request, ip, ua);
        return Ok(ApiResponse<object>.Ok(unit, "Status updated"));
    }
}
