using EVMManagement.Api.DTOs;
using EVMManagement.Api.DTOs.Dispatch;
using EVMManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EVMManagement.Api.Controllers;

[ApiController]
[Route("api/dispatch")]
[Authorize]
public class DispatchController : ControllerBase
{
    private readonly IDispatchService _dispatchService;

    public DispatchController(IDispatchService dispatchService) => _dispatchService = dispatchService;

    private int CurrentUserId => int.Parse(User.FindFirst("userId")!.Value);
    private int? CurrentStateId => User.FindFirst("stateId") is { } c ? int.Parse(c.Value) : null;
    private int? CurrentDistrictId => User.FindFirst("districtId") is { } c ? int.Parse(c.Value) : null;

    /// <summary>GET /api/dispatch — list all dispatch batches</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DispatchListFilter filter)
    {
        if (!User.IsInRole("ADMIN"))
        {
            if (User.IsInRole("DISTRICT_OFFICER"))
            {
                filter.FromStateId = CurrentStateId;
                filter.FromDistrictId = CurrentDistrictId;
            }
            else if (User.IsInRole("STATE_OFFICER"))
            {
                filter.FromStateId = CurrentStateId;
            }
        }

        var (batches, total) = await _dispatchService.ListBatchesAsync(filter);
        return Ok(ApiResponse<object>.Ok(batches, pagination: new PaginationMeta
        {
            Page = filter.Page, Limit = filter.Limit, Total = total,
            TotalPages = (int)Math.Ceiling((double)total / filter.Limit)
        }));
    }

    /// <summary>GET /api/dispatch/pending — batches pending receipt for current user</summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        if (!CurrentStateId.HasValue)
            return Ok(ApiResponse<object>.Ok(new List<object>()));

        var batches = await _dispatchService.GetPendingReceivablesAsync(CurrentStateId.Value, CurrentDistrictId);
        return Ok(ApiResponse<object>.Ok(batches));
    }

    /// <summary>GET /api/dispatch/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var batch = await _dispatchService.GetBatchAsync(id);
        if (batch == null) return NotFound(new ApiErrorResponse { Error = new ApiError { Code = "NOT_FOUND", Message = "Batch not found" } });
        return Ok(ApiResponse<object>.Ok(batch));
    }

    /// <summary>POST /api/dispatch — initiate new dispatch</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDispatchRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!CurrentStateId.HasValue)
            return BadRequest(new ApiErrorResponse { Error = new ApiError { Code = "MISSING_STATE", Message = "User must be assigned to a state to dispatch" } });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var batch = await _dispatchService.InitiateDispatchAsync(
            CurrentUserId, CurrentStateId.Value, CurrentDistrictId, request, ip, ua);

        return Created($"/api/dispatch/{batch.BatchId}", ApiResponse<object>.Ok(batch, "Dispatch created successfully"));
    }

    /// <summary>POST /api/dispatch/{id}/receive — process receipt of a batch</summary>
    [HttpPost("{id:int}/receive")]
    public async Task<IActionResult> Receive(int id, [FromBody] ReceiveDispatchRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!CurrentStateId.HasValue)
            return BadRequest(new ApiErrorResponse { Error = new ApiError { Code = "MISSING_STATE", Message = "User must be assigned to a state to receive" } });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var batch = await _dispatchService.ReceiveDispatchAsync(
            CurrentUserId, CurrentStateId.Value, CurrentDistrictId, id, request, ip, ua);

        return Ok(ApiResponse<object>.Ok(batch, "Batch received successfully"));
    }

    /// <summary>DELETE /api/dispatch/{id} — cancel batch (admin only)</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelDispatchRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        await _dispatchService.CancelBatchAsync(CurrentUserId, id, request.Reason, ip, ua);
        return Ok(ApiResponse<object>.Ok(null!, "Batch cancelled"));
    }
}
