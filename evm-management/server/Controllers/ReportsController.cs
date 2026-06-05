using Dapper;
using EVMManagement.Api.Data;
using EVMManagement.Api.DTOs;
using EVMManagement.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EVMManagement.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IEvmRepository _evmRepo;
    private readonly DbConnectionFactory _db;

    public ReportsController(IEvmRepository evmRepo, DbConnectionFactory db)
    {
        _evmRepo = evmRepo;
        _db = db;
    }

    /// <summary>GET /api/reports/inventory-summary — units by state/type/status</summary>
    [HttpGet("reports/inventory-summary")]
    public async Task<IActionResult> InventorySummary()
    {
        var data = await _evmRepo.GetInventorySummaryAsync();
        return Ok(ApiResponse<object>.Ok(data));
    }

    /// <summary>GET /api/reports/status-breakdown — pie chart data</summary>
    [HttpGet("reports/status-breakdown")]
    public async Task<IActionResult> StatusBreakdown()
    {
        var counts = await _evmRepo.GetStatusCountsAsync();
        return Ok(ApiResponse<object>.Ok(counts));
    }

    /// <summary>GET /api/reports/dispatch-history — dispatch batches with date range filter</summary>
    [HttpGet("reports/dispatch-history")]
    public async Task<IActionResult> DispatchHistory([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int page = 1, [FromQuery] int limit = 50)
    {
        using var conn = _db.CreateConnection();
        var conditions = new List<string> { "1=1" };
        var parameters = new DynamicParameters();
        if (from.HasValue) { conditions.Add("b.dispatch_date >= @From"); parameters.Add("From", from.Value); }
        if (to.HasValue) { conditions.Add("b.dispatch_date <= @To"); parameters.Add("To", to.Value); }
        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        var where = string.Join(" AND ", conditions);
        var data = await conn.QueryAsync(
            $@"SELECT b.batch_id AS BatchId, b.batch_code AS BatchCode, b.dispatch_date AS DispatchDate,
                      b.dispatch_status AS DispatchStatus, b.total_units AS TotalUnits,
                      u.full_name AS DispatchedByName,
                      fs.state_name AS FromStateName, ts.state_name AS ToStateName
               FROM dispatch_batches b
               JOIN users u ON b.dispatched_by = u.user_id
               JOIN states fs ON b.from_state_id = fs.state_id
               JOIN states ts ON b.to_state_id = ts.state_id
               WHERE {where}
               ORDER BY b.dispatch_date DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters);

        return Ok(ApiResponse<object>.Ok(data));
    }

    /// <summary>GET /api/reports/movement-timeline — timeline of unit movements</summary>
    [HttpGet("reports/movement-timeline")]
    public async Task<IActionResult> MovementTimeline([FromQuery] int? unitId, [FromQuery] int page = 1, [FromQuery] int limit = 50)
    {
        using var conn = _db.CreateConnection();
        var parameters = new DynamicParameters();
        var where = unitId.HasValue ? "WHERE h.unit_id = @UnitId" : "";
        if (unitId.HasValue) parameters.Add("UnitId", unitId.Value);
        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        var data = await conn.QueryAsync(
            $@"SELECT h.history_id AS HistoryId, h.action_type AS ActionType, h.action_date AS ActionDate,
                      e.unit_code AS UnitCode, u.full_name AS ActionBy,
                      fs.state_name AS FromState, ts.state_name AS ToState, b.batch_code AS BatchCode
               FROM evm_movement_history h
               JOIN evm_units e ON h.unit_id = e.unit_id
               JOIN users u ON h.action_by = u.user_id
               LEFT JOIN states fs ON h.from_state_id = fs.state_id
               LEFT JOIN states ts ON h.to_state_id = ts.state_id
               LEFT JOIN dispatch_batches b ON h.batch_id = b.batch_id
               {where}
               ORDER BY h.action_date DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters);

        return Ok(ApiResponse<object>.Ok(data));
    }

    /// <summary>GET /api/reports/dashboard — dashboard KPI data</summary>
    [HttpGet("reports/dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        using var conn = _db.CreateConnection();
        var statusCounts = await _evmRepo.GetStatusCountsAsync();

        var recentDispatches = await conn.QueryAsync(
            @"SELECT TOP 10 b.batch_id AS BatchId, b.batch_code AS BatchCode, b.dispatch_date AS DispatchDate,
                     b.dispatch_status AS DispatchStatus, b.total_units AS TotalUnits,
                     fs.state_name AS FromStateName, ts.state_name AS ToStateName
              FROM dispatch_batches b
              JOIN states fs ON b.from_state_id = fs.state_id
              JOIN states ts ON b.to_state_id = ts.state_id
              ORDER BY b.dispatch_date DESC");

        var unitsByState = await conn.QueryAsync(
            @"SELECT s.state_name AS StateName, COUNT(*) AS TotalUnits,
                     SUM(CASE WHEN e.unit_type = 'CONTROL_UNIT' THEN 1 ELSE 0 END) AS ControlUnits,
                     SUM(CASE WHEN e.unit_type = 'BALLOT_UNIT' THEN 1 ELSE 0 END) AS BallotUnits,
                     SUM(CASE WHEN e.unit_type = 'VVPAT' THEN 1 ELSE 0 END) AS VVPATs
              FROM evm_units e
              LEFT JOIN states s ON e.current_state_id = s.state_id
              WHERE e.is_active = 1
              GROUP BY s.state_name
              ORDER BY TotalUnits DESC");

        return Ok(ApiResponse<object>.Ok(new
        {
            StatusCounts = statusCounts,
            RecentDispatches = recentDispatches,
            UnitsByState = unitsByState,
        }));
    }

    /// <summary>GET /api/audit — audit log (admin only)</summary>
    [HttpGet("audit")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AuditLogs([FromQuery] string? action, [FromQuery] string? entityType, [FromQuery] int page = 1, [FromQuery] int limit = 50)
    {
        using var conn = _db.CreateConnection();
        var conditions = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(action)) { conditions.Add("al.action LIKE @Action"); parameters.Add("Action", $"%{action}%"); }
        if (!string.IsNullOrEmpty(entityType)) { conditions.Add("al.entity_type = @EntityType"); parameters.Add("EntityType", entityType); }
        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        var where = string.Join(" AND ", conditions);
        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM audit_logs al WHERE {where}", parameters);
        var logs = await conn.QueryAsync(
            $@"SELECT al.log_id AS LogId, al.action AS Action, al.entity_type AS EntityType, al.entity_id AS EntityId,
                      al.old_values AS OldValues, al.new_values AS NewValues,
                      al.ip_address AS IpAddress, al.created_at AS CreatedAt,
                      u.user_code AS UserCode, u.full_name AS FullName
               FROM audit_logs al
               LEFT JOIN users u ON al.user_id = u.user_id
               WHERE {where}
               ORDER BY al.created_at DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters);

        return Ok(ApiResponse<object>.Ok(logs, pagination: new PaginationMeta
        {
            Page = page, Limit = limit, Total = total,
            TotalPages = (int)Math.Ceiling((double)total / limit)
        }));
    }

    /// <summary>GET /api/search/global?q= — global search</summary>
    [HttpGet("search/global")]
    public async Task<IActionResult> GlobalSearch([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 3)
            return BadRequest(new ApiErrorResponse { Error = new ApiError { Code = "INVALID_QUERY", Message = "Search query must be at least 3 characters" } });

        var results = await _evmRepo.GlobalSearchAsync(q);
        return Ok(ApiResponse<object>.Ok(results));
    }

    /// <summary>GET /api/reference/states</summary>
    [HttpGet("reference/states")]
    public async Task<IActionResult> GetStates()
    {
        using var conn = _db.CreateConnection();
        var states = await conn.QueryAsync("SELECT state_id AS StateId, state_code AS StateCode, state_name AS StateName FROM states WHERE is_active = 1 ORDER BY state_name");
        return Ok(ApiResponse<object>.Ok(states));
    }

    /// <summary>GET /api/reference/districts?stateId=</summary>
    [HttpGet("reference/districts")]
    public async Task<IActionResult> GetDistricts([FromQuery] int? stateId)
    {
        using var conn = _db.CreateConnection();
        var where = stateId.HasValue ? "WHERE d.state_id = @StateId AND d.is_active = 1" : "WHERE d.is_active = 1";
        var districts = await conn.QueryAsync(
            $"SELECT d.district_id AS DistrictId, d.district_code AS DistrictCode, d.district_name AS DistrictName, d.state_id AS StateId FROM districts d {where} ORDER BY d.district_name",
            new { StateId = stateId });
        return Ok(ApiResponse<object>.Ok(districts));
    }
}
