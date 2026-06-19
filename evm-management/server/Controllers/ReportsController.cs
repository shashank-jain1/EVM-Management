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

    /// <summary>GET /api/reports/inventory-summary — units by state/district</summary>
    [HttpGet("reports/inventory-summary")]
    public async Task<IActionResult> InventorySummary([FromQuery] int? stateId, [FromQuery] int? districtId)
    {
        using var conn = _db.CreateConnection();
        var conditions = new List<string> { "e.is_active = 1" };
        var parameters = new DynamicParameters();

        // Location restriction for non-admins
        var userStateId = User.FindFirst("stateId") is { } s ? int.Parse(s.Value) : (int?)null;
        var userDistrictId = User.FindFirst("districtId") is { } d ? int.Parse(d.Value) : (int?)null;

        if (!User.IsInRole("ADMIN"))
        {
            if (User.IsInRole("DISTRICT_OFFICER"))
            {
                stateId = userStateId;
                districtId = userDistrictId;
            }
            else if (User.IsInRole("STATE_OFFICER"))
            {
                stateId = userStateId;
            }
        }

        if (stateId.HasValue) { conditions.Add("e.current_state_id = @StateId"); parameters.Add("StateId", stateId.Value); }
        if (districtId.HasValue) { conditions.Add("e.current_district_id = @DistrictId"); parameters.Add("DistrictId", districtId.Value); }

        var where = string.Join(" AND ", conditions);

        var data = await conn.QueryAsync(
            $@"SELECT s.state_name AS stateName, d.district_name AS districtName,
                      COUNT(*) AS totalUnits,
                      SUM(CASE WHEN e.unit_type = 'CONTROL_UNIT' THEN 1 ELSE 0 END) AS controlUnits,
                      SUM(CASE WHEN e.unit_type = 'BALLOT_UNIT' THEN 1 ELSE 0 END) AS ballotUnits,
                      SUM(CASE WHEN e.unit_type = 'DMM' THEN 1 ELSE 0 END) AS dmmUnits
               FROM evm_units e
               LEFT JOIN states s ON e.current_state_id = s.state_id
               LEFT JOIN districts d ON e.current_district_id = d.district_id
               WHERE {where}
               GROUP BY s.state_name, d.district_name
               ORDER BY s.state_name, d.district_name", parameters);

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
    public async Task<IActionResult> DispatchHistory([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        using var conn = _db.CreateConnection();
        var conditions = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        // Location restriction for non-admins
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userStateId = User.FindFirst("stateId") is { } s ? int.Parse(s.Value) : (int?)null;
        var userDistrictId = User.FindFirst("districtId") is { } d ? int.Parse(d.Value) : (int?)null;

        if (role != "ADMIN")
        {
            if (role == "DISTRICT_OFFICER")
            {
                conditions.Add("(b.from_state_id = @StateId OR b.to_state_id = @StateId)");
                conditions.Add("(b.from_district_id = @DistrictId OR b.to_district_id = @DistrictId OR b.from_district_id IS NULL OR b.to_district_id IS NULL)");
                parameters.Add("StateId", userStateId);
                parameters.Add("DistrictId", userDistrictId);
            }
            else if (role == "STATE_OFFICER")
            {
                conditions.Add("(b.from_state_id = @StateId OR b.to_state_id = @StateId)");
                parameters.Add("StateId", userStateId);
            }
        }

        if (from.HasValue) { conditions.Add("b.dispatch_date >= @From"); parameters.Add("From", from.Value); }
        if (to.HasValue) { conditions.Add("b.dispatch_date <= @To"); parameters.Add("To", to.Value); }

        var where = string.Join(" AND ", conditions);
        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM dispatch_batches b WHERE {where}", parameters);

        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        var data = await conn.QueryAsync(
            $@"SELECT b.batch_id AS batchId, b.batch_code AS batchCode, b.dispatch_date AS dispatchDate,
                      b.expected_arrival AS expectedArrival, b.actual_arrival AS actualArrival,
                      b.dispatch_status AS dispatchStatus, b.total_units AS totalUnits,
                      u.full_name AS dispatchedByName,
                      fs.state_name AS fromStateName, fd.district_name AS fromDistrictName,
                      ts.state_name AS toStateName, td.district_name AS toDistrictName
               FROM dispatch_batches b
               JOIN users u ON b.dispatched_by = u.user_id
               JOIN states fs ON b.from_state_id = fs.state_id
               LEFT JOIN districts fd ON b.from_district_id = fd.district_id
               JOIN states ts ON b.to_state_id = ts.state_id
               LEFT JOIN districts td ON b.to_district_id = td.district_id
               WHERE {where}
               ORDER BY b.dispatch_date DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters);

        return Ok(ApiResponse<object>.Ok(data, pagination: new PaginationMeta
        {
            Page = page, Limit = limit, Total = total,
            TotalPages = (int)Math.Ceiling((double)total / limit)
        }));
    }

    /// <summary>GET /api/reports/movement-timeline — timeline of unit movements</summary>
    [HttpGet("reports/movement-timeline")]
    public async Task<IActionResult> MovementTimeline([FromQuery] int? unitId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        using var conn = _db.CreateConnection();
        var conditions = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        // Location restriction for non-admins
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userStateId = User.FindFirst("stateId") is { } s ? int.Parse(s.Value) : (int?)null;
        var userDistrictId = User.FindFirst("districtId") is { } d ? int.Parse(d.Value) : (int?)null;

        if (role != "ADMIN")
        {
            if (role == "DISTRICT_OFFICER")
            {
                conditions.Add("((h.from_state_id = @StateId AND h.from_district_id = @DistrictId) OR (h.to_state_id = @StateId AND h.to_district_id = @DistrictId))");
                parameters.Add("StateId", userStateId);
                parameters.Add("DistrictId", userDistrictId);
            }
            else if (role == "STATE_OFFICER")
            {
                conditions.Add("(h.from_state_id = @StateId OR h.to_state_id = @StateId)");
                parameters.Add("StateId", userStateId);
            }
        }

        if (unitId.HasValue) { conditions.Add("h.unit_id = @UnitId"); parameters.Add("UnitId", unitId.Value); }

        var where = string.Join(" AND ", conditions);
        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM evm_movement_history h WHERE {where}", parameters);

        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        var data = await conn.QueryAsync(
            $@"SELECT h.history_id AS historyId, h.action_type AS actionType, h.action_date AS actionDate,
                      e.unit_code AS unitCode, e.unit_type AS unitType, u.full_name AS actionByName,
                      fs.state_name AS fromStateName, fd.district_name AS fromDistrictName,
                      ts.state_name AS toStateName, td.district_name AS toDistrictName,
                      b.batch_code AS batchCode, h.remarks AS remarks
               FROM evm_movement_history h
               JOIN evm_units e ON h.unit_id = e.unit_id
               JOIN users u ON h.action_by = u.user_id
               LEFT JOIN states fs ON h.from_state_id = fs.state_id
               LEFT JOIN districts fd ON h.from_district_id = fd.district_id
               LEFT JOIN states ts ON h.to_state_id = ts.state_id
               LEFT JOIN districts td ON h.to_district_id = td.district_id
               LEFT JOIN dispatch_batches b ON h.batch_id = b.batch_id
               WHERE {where}
               ORDER BY h.action_date DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters);

        return Ok(ApiResponse<object>.Ok(data, pagination: new PaginationMeta
        {
            Page = page, Limit = limit, Total = total,
            TotalPages = (int)Math.Ceiling((double)total / limit)
        }));
    }

    /// <summary>GET /api/reports/dashboard — dashboard KPI data</summary>
    [HttpGet("reports/dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        using var conn = _db.CreateConnection();
        
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var userStateId = User.FindFirst("stateId") is { } s ? int.Parse(s.Value) : (int?)null;
        var userDistrictId = User.FindFirst("districtId") is { } d ? int.Parse(d.Value) : (int?)null;

        // --- Status Counts (filtered) ---
        var statusConditions = new List<string> { "is_active = 1" };
        var statusParams = new DynamicParameters();
        if (role == "DISTRICT_OFFICER")
        {
            statusConditions.Add("current_state_id = @StateId");
            statusConditions.Add("current_district_id = @DistrictId");
            statusParams.Add("StateId", userStateId);
            statusParams.Add("DistrictId", userDistrictId);
        }
        else if (role == "STATE_OFFICER")
        {
            statusConditions.Add("current_state_id = @StateId");
            statusParams.Add("StateId", userStateId);
        }
        var statusWhere = string.Join(" AND ", statusConditions);
        var statusRows = await conn.QueryAsync(
            $"SELECT current_status AS Status, COUNT(*) AS Cnt FROM evm_units WHERE {statusWhere} GROUP BY current_status",
            statusParams);
        var statusCounts = statusRows.ToDictionary(r => (string)r.Status, r => (int)r.Cnt);

        // --- Recent Dispatches (filtered) ---
        var recentConditions = new List<string> { "1=1" };
        var recentParams = new DynamicParameters();
        if (role == "DISTRICT_OFFICER")
        {
            recentConditions.Add("(b.from_state_id = @StateId OR b.to_state_id = @StateId)");
            recentConditions.Add("(b.from_district_id = @DistrictId OR b.to_district_id = @DistrictId OR b.from_district_id IS NULL OR b.to_district_id IS NULL)");
            recentParams.Add("StateId", userStateId);
            recentParams.Add("DistrictId", userDistrictId);
        }
        else if (role == "STATE_OFFICER")
        {
            recentConditions.Add("(b.from_state_id = @StateId OR b.to_state_id = @StateId)");
            recentParams.Add("StateId", userStateId);
        }
        var recentWhere = string.Join(" AND ", recentConditions);
        var recentDispatches = await conn.QueryAsync<DashboardRecentDispatchDto>(
            $@"SELECT TOP 10 b.batch_id AS BatchId, b.batch_code AS BatchCode, b.dispatch_date AS DispatchDate,
                     b.dispatch_status AS DispatchStatus, b.total_units AS TotalUnits,
                     fs.state_name AS FromStateName, ts.state_name AS ToStateName
              FROM dispatch_batches b
              JOIN states fs ON b.from_state_id = fs.state_id
              JOIN states ts ON b.to_state_id = ts.state_id
              WHERE {recentWhere}
              ORDER BY b.dispatch_date DESC", recentParams);

        // --- District Breakdown (filtered) ---
        var districtConditions = new List<string> { "e.is_active = 1" };
        var districtParams = new DynamicParameters();
        if (role == "DISTRICT_OFFICER")
        {
            districtConditions.Add("e.current_state_id = @StateId");
            districtConditions.Add("e.current_district_id = @DistrictId");
            districtParams.Add("StateId", userStateId);
            districtParams.Add("DistrictId", userDistrictId);
        }
        else if (role == "STATE_OFFICER")
        {
            districtConditions.Add("e.current_state_id = @StateId");
            districtParams.Add("StateId", userStateId);
        }
        var districtWhere = string.Join(" AND ", districtConditions);
        
        var unitsByDistrict = await conn.QueryAsync<DashboardDistrictAllocationDto>(
            $@"SELECT COALESCE(d.district_name, 'State Headquarters') AS DistrictName, COUNT(*) AS TotalUnits,
                     SUM(CASE WHEN e.unit_type = 'CONTROL_UNIT' THEN 1 ELSE 0 END) AS ControlUnits,
                     SUM(CASE WHEN e.unit_type = 'BALLOT_UNIT' THEN 1 ELSE 0 END) AS BallotUnits,
                     SUM(CASE WHEN e.unit_type = 'DMM' THEN 1 ELSE 0 END) AS Dmms
              FROM evm_units e
              LEFT JOIN districts d ON e.current_district_id = d.district_id
              WHERE {districtWhere}
              GROUP BY d.district_name
              ORDER BY TotalUnits DESC", districtParams);

        // --- Sent Units (filtered) ---
        var sentConditions = new List<string> { "dispatch_status <> 'CANCELLED'" };
        var sentParams = new DynamicParameters();
        if (role == "DISTRICT_OFFICER")
        {
            sentConditions.Add("from_state_id = @StateId");
            sentConditions.Add("from_district_id = @DistrictId");
            sentParams.Add("StateId", userStateId);
            sentParams.Add("DistrictId", userDistrictId);
        }
        else if (role == "STATE_OFFICER")
        {
            sentConditions.Add("from_state_id = @StateId");
            sentParams.Add("StateId", userStateId);
        }
        var sentWhere = string.Join(" AND ", sentConditions);
        var sentUnits = await conn.ExecuteScalarAsync<int>(
            $"SELECT ISNULL(SUM(total_units), 0) FROM dispatch_batches WHERE {sentWhere}", sentParams);

        // --- Received Units (filtered) ---
        var recConditions = new List<string> { "di.item_status = 'RECEIVED'" };
        var recParams = new DynamicParameters();
        if (role == "DISTRICT_OFFICER")
        {
            recConditions.Add("db.to_state_id = @StateId");
            recConditions.Add("db.to_district_id = @DistrictId");
            recParams.Add("StateId", userStateId);
            recParams.Add("DistrictId", userDistrictId);
        }
        else if (role == "STATE_OFFICER")
        {
            recConditions.Add("db.to_state_id = @StateId");
            recParams.Add("StateId", userStateId);
        }
        var recWhere = string.Join(" AND ", recConditions);
        var receivedUnits = await conn.ExecuteScalarAsync<int>(
            $@"SELECT COUNT(1) 
               FROM dispatch_items di
               JOIN dispatch_batches db ON di.batch_id = db.batch_id
               WHERE {recWhere}", recParams);

        return Ok(ApiResponse<object>.Ok(new DashboardReportDto
        {
            StatusCounts = statusCounts,
            RecentDispatches = recentDispatches,
            UnitsByDistrict = unitsByDistrict,
            SentUnits = sentUnits,
            ReceivedUnits = receivedUnits
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
            $@"SELECT al.log_id AS logId, al.action AS action, al.entity_type AS entityType, al.entity_id AS entityId,
                      al.old_values AS oldValues, al.new_values AS newValues,
                      al.ip_address AS ipAddress, al.created_at AS createdAt,
                      u.user_code AS userCode, u.full_name AS fullName
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

public class DashboardReportDto
{
    public Dictionary<string, int> StatusCounts { get; set; } = new();
    public IEnumerable<DashboardRecentDispatchDto> RecentDispatches { get; set; } = new List<DashboardRecentDispatchDto>();
    public IEnumerable<DashboardDistrictAllocationDto> UnitsByDistrict { get; set; } = new List<DashboardDistrictAllocationDto>();
    public int SentUnits { get; set; }
    public int ReceivedUnits { get; set; }
}

public class DashboardRecentDispatchDto
{
    public int BatchId { get; set; }
    public string BatchCode { get; set; } = string.Empty;
    public DateTime DispatchDate { get; set; }
    public string DispatchStatus { get; set; } = string.Empty;
    public int TotalUnits { get; set; }
    public string FromStateName { get; set; } = string.Empty;
    public string ToStateName { get; set; } = string.Empty;
}

public class DashboardDistrictAllocationDto
{
    public string DistrictName { get; set; } = string.Empty;
    public int TotalUnits { get; set; }
    public int ControlUnits { get; set; }
    public int BallotUnits { get; set; }
    public int Dmms { get; set; }
}
