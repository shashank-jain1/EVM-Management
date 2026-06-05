using Dapper;
using EVMManagement.Api.Data;
using EVMManagement.Api.Models;

namespace EVMManagement.Api.Repositories;

public interface IEvmRepository
{
    Task<EvmUnit?> FindByCodeAsync(string unitCode);
    Task<EvmUnit?> FindByIdAsync(int unitId);
    Task<int> CreateUnitAsync(EvmUnit unit, int createdBy);
    Task UpdateUnitStatusAsync(int unitId, string status, int? stateId, int? districtId, string? locationDesc);
    Task<(List<EvmUnit> Units, int Total)> ListUnitsAsync(Dictionary<string, object?> filters, int page, int limit);
    Task<List<EvmMovementHistory>> GetUnitHistoryAsync(int unitId);
    Task AddMovementHistoryAsync(int unitId, string actionType, int? batchId, int? fromStateId, int? fromDistrictId, int? toStateId, int? toDistrictId, int actionBy, string? remarks);
    Task<List<object>> GlobalSearchAsync(string query);
    Task<List<dynamic>> GetInventorySummaryAsync();
    Task<Dictionary<string, int>> GetStatusCountsAsync();
}

public class EvmRepository : IEvmRepository
{
    private readonly DbConnectionFactory _db;

    public EvmRepository(DbConnectionFactory db) => _db = db;

    public async Task<EvmUnit?> FindByCodeAsync(string unitCode)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<EvmUnit>(
            @"SELECT e.unit_id AS UnitId, e.unit_code AS UnitCode, e.unit_type AS UnitType,
                     e.manufacturer AS Manufacturer, e.manufacturing_year AS ManufacturingYear,
                     e.serial_number AS SerialNumber, e.current_state_id AS CurrentStateId,
                     e.current_district_id AS CurrentDistrictId,
                     e.current_location_description AS CurrentLocationDescription,
                     e.current_status AS CurrentStatus, e.is_active AS IsActive,
                     e.created_at AS CreatedAt, e.updated_at AS UpdatedAt,
                     s.state_name AS StateName, s.state_code AS StateCode,
                     d.district_name AS DistrictName, d.district_code AS DistrictCode
              FROM evm_units e
              LEFT JOIN states s ON e.current_state_id = s.state_id
              LEFT JOIN districts d ON e.current_district_id = d.district_id
              WHERE e.unit_code = @UnitCode",
            new { UnitCode = unitCode });
    }

    public async Task<EvmUnit?> FindByIdAsync(int unitId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<EvmUnit>(
            @"SELECT e.unit_id AS UnitId, e.unit_code AS UnitCode, e.unit_type AS UnitType,
                     e.manufacturer AS Manufacturer, e.manufacturing_year AS ManufacturingYear,
                     e.serial_number AS SerialNumber, e.current_state_id AS CurrentStateId,
                     e.current_district_id AS CurrentDistrictId,
                     e.current_location_description AS CurrentLocationDescription,
                     e.current_status AS CurrentStatus, e.is_active AS IsActive,
                     e.created_at AS CreatedAt, e.updated_at AS UpdatedAt,
                     s.state_name AS StateName, s.state_code AS StateCode,
                     d.district_name AS DistrictName, d.district_code AS DistrictCode
              FROM evm_units e
              LEFT JOIN states s ON e.current_state_id = s.state_id
              LEFT JOIN districts d ON e.current_district_id = d.district_id
              WHERE e.unit_id = @UnitId",
            new { UnitId = unitId });
    }

    public async Task<int> CreateUnitAsync(EvmUnit unit, int createdBy)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO evm_units (unit_code, unit_type, manufacturer, manufacturing_year,
                serial_number, current_state_id, current_district_id, current_location_description,
                current_status, created_by)
              OUTPUT INSERTED.unit_id
              VALUES (@UnitCode, @UnitType, @Manufacturer, @ManufacturingYear,
                @SerialNumber, @CurrentStateId, @CurrentDistrictId, @CurrentLocationDescription,
                'IN_WAREHOUSE', @CreatedBy)",
            new
            {
                unit.UnitCode, unit.UnitType, unit.Manufacturer, unit.ManufacturingYear,
                unit.SerialNumber, unit.CurrentStateId, unit.CurrentDistrictId,
                unit.CurrentLocationDescription, CreatedBy = createdBy
            });
    }

    public async Task UpdateUnitStatusAsync(int unitId, string status, int? stateId, int? districtId, string? locationDesc)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE evm_units SET current_status = @Status, current_state_id = @StateId,
                current_district_id = @DistrictId, current_location_description = @LocationDesc,
                updated_at = GETDATE()
              WHERE unit_id = @UnitId",
            new { UnitId = unitId, Status = status, StateId = stateId, DistrictId = districtId, LocationDesc = locationDesc });
    }

    public async Task<(List<EvmUnit> Units, int Total)> ListUnitsAsync(Dictionary<string, object?> filters, int page, int limit)
    {
        var conditions = new List<string> { "e.is_active = 1" };
        var parameters = new DynamicParameters();

        if (filters.TryGetValue("StateId", out var s) && s != null) { conditions.Add("e.current_state_id = @StateId"); parameters.Add("StateId", s); }
        if (filters.TryGetValue("DistrictId", out var d) && d != null) { conditions.Add("e.current_district_id = @DistrictId"); parameters.Add("DistrictId", d); }
        if (filters.TryGetValue("UnitType", out var ut) && ut != null) { conditions.Add("e.unit_type = @UnitType"); parameters.Add("UnitType", ut); }
        if (filters.TryGetValue("Status", out var st) && st != null) { conditions.Add("e.current_status = @Status"); parameters.Add("Status", st); }
        if (filters.TryGetValue("Search", out var search) && search != null) { conditions.Add("(e.unit_code LIKE @Search OR e.serial_number LIKE @Search)"); parameters.Add("Search", $"%{search}%"); }

        var where = string.Join(" AND ", conditions);
        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        using var conn = _db.CreateConnection();
        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM evm_units e WHERE {where}", parameters);
        var units = (await conn.QueryAsync<EvmUnit>(
            $@"SELECT e.unit_id AS UnitId, e.unit_code AS UnitCode, e.unit_type AS UnitType,
                      e.manufacturer AS Manufacturer, e.manufacturing_year AS ManufacturingYear,
                      e.serial_number AS SerialNumber, e.current_status AS CurrentStatus,
                      e.current_location_description AS CurrentLocationDescription,
                      e.current_state_id AS CurrentStateId, e.current_district_id AS CurrentDistrictId,
                      e.created_at AS CreatedAt, e.updated_at AS UpdatedAt,
                      s.state_name AS StateName, s.state_code AS StateCode,
                      d.district_name AS DistrictName, d.district_code AS DistrictCode
               FROM evm_units e
               LEFT JOIN states s ON e.current_state_id = s.state_id
               LEFT JOIN districts d ON e.current_district_id = d.district_id
               WHERE {where}
               ORDER BY e.created_at DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters)).ToList();

        return (units, total);
    }

    public async Task<List<EvmMovementHistory>> GetUnitHistoryAsync(int unitId)
    {
        using var conn = _db.CreateConnection();
        return (await conn.QueryAsync<EvmMovementHistory>(
            @"SELECT h.history_id AS HistoryId, h.action_type AS ActionType, h.action_date AS ActionDate,
                     h.remarks AS Remarks, h.batch_id AS BatchId,
                     u.full_name AS ActionByName, u.user_code AS ActionByCode,
                     fs.state_name AS FromStateName, fd.district_name AS FromDistrictName,
                     ts.state_name AS ToStateName, td.district_name AS ToDistrictName,
                     b.batch_code AS BatchCode
              FROM evm_movement_history h
              JOIN users u ON h.action_by = u.user_id
              LEFT JOIN states fs ON h.from_state_id = fs.state_id
              LEFT JOIN districts fd ON h.from_district_id = fd.district_id
              LEFT JOIN states ts ON h.to_state_id = ts.state_id
              LEFT JOIN districts td ON h.to_district_id = td.district_id
              LEFT JOIN dispatch_batches b ON h.batch_id = b.batch_id
              WHERE h.unit_id = @UnitId
              ORDER BY h.action_date DESC",
            new { UnitId = unitId })).ToList();
    }

    public async Task AddMovementHistoryAsync(int unitId, string actionType, int? batchId, int? fromStateId, int? fromDistrictId, int? toStateId, int? toDistrictId, int actionBy, string? remarks)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            @"INSERT INTO evm_movement_history
                (unit_id, action_type, batch_id, from_state_id, from_district_id, to_state_id, to_district_id, action_by, remarks)
              VALUES (@UnitId, @ActionType, @BatchId, @FromStateId, @FromDistrictId, @ToStateId, @ToDistrictId, @ActionBy, @Remarks)",
            new { UnitId = unitId, ActionType = actionType, BatchId = batchId, FromStateId = fromStateId, FromDistrictId = fromDistrictId, ToStateId = toStateId, ToDistrictId = toDistrictId, ActionBy = actionBy, Remarks = remarks });
    }

    public async Task<List<object>> GlobalSearchAsync(string query)
    {
        var search = $"%{query}%";
        using var conn = _db.CreateConnection();
        var results = await conn.QueryAsync(
            @"SELECT 'EVM_UNIT' AS ResultType, e.unit_id AS Id, e.unit_code AS Code,
                     e.unit_type AS Subtype, e.current_status AS Status,
                     s.state_name AS StateName, d.district_name AS DistrictName, e.serial_number AS Extra
              FROM evm_units e
              LEFT JOIN states s ON e.current_state_id = s.state_id
              LEFT JOIN districts d ON e.current_district_id = d.district_id
              WHERE e.unit_code LIKE @Search OR e.serial_number LIKE @Search
              UNION ALL
              SELECT 'DISPATCH_BATCH' AS ResultType, b.batch_id AS Id, b.batch_code AS Code,
                     b.dispatch_status AS Subtype, b.dispatch_status AS Status,
                     fs.state_name AS StateName, ts.state_name AS DistrictName,
                     CAST(b.total_units AS NVARCHAR) AS Extra
              FROM dispatch_batches b
              JOIN states fs ON b.from_state_id = fs.state_id
              JOIN states ts ON b.to_state_id = ts.state_id
              WHERE b.batch_code LIKE @Search",
            new { Search = search });
        return results.Cast<object>().ToList();
    }

    public async Task<List<dynamic>> GetInventorySummaryAsync()
    {
        using var conn = _db.CreateConnection();
        return (await conn.QueryAsync(
            @"SELECT s.state_name AS StateName, e.unit_type AS UnitType, e.current_status AS CurrentStatus, COUNT(*) AS UnitCount
              FROM evm_units e
              LEFT JOIN states s ON e.current_state_id = s.state_id
              WHERE e.is_active = 1
              GROUP BY s.state_name, e.unit_type, e.current_status
              ORDER BY s.state_name, e.unit_type")).ToList();
    }

    public async Task<Dictionary<string, int>> GetStatusCountsAsync()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync(@"SELECT current_status AS Status, COUNT(*) AS Cnt FROM evm_units WHERE is_active = 1 GROUP BY current_status");
        return rows.ToDictionary(r => (string)r.Status, r => (int)r.Cnt);
    }
}
