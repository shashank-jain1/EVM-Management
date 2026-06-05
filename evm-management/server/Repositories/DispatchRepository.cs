using Dapper;
using EVMManagement.Api.Data;
using EVMManagement.Api.Models;
using EVMManagement.Api.Utils;

namespace EVMManagement.Api.Repositories;

public interface IDispatchRepository
{
    Task<(int BatchId, string BatchCode)> CreateBatchAsync(DispatchBatch batch);
    Task AddItemsToBatchAsync(int batchId, List<int> unitIds);
    Task<DispatchBatch?> GetBatchByIdAsync(int batchId);
    Task<(List<DispatchBatch> Batches, int Total)> ListBatchesAsync(Dictionary<string, object?> filters, int page, int limit);
    Task<List<DispatchBatch>> GetPendingReceivablesAsync(int stateId, int? districtId);
    Task UpdateBatchOnReceiptAsync(int batchId, int receivedById, bool allReceived);
    Task UpdateDispatchItemAsync(int itemId, string itemStatus, string? conditionOnReceipt, string? remarks);
    Task CancelBatchAsync(int batchId, string? reason);
}

public class DispatchRepository : IDispatchRepository
{
    private readonly DbConnectionFactory _db;

    public DispatchRepository(DbConnectionFactory db) => _db = db;

    public async Task<(int BatchId, string BatchCode)> CreateBatchAsync(DispatchBatch batch)
    {
        var batchCode = BatchCodeGenerator.Generate();
        using var conn = _db.CreateConnection();

        // Ensure unique code
        for (int i = 0; i < 5; i++)
        {
            var exists = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dispatch_batches WHERE batch_code = @BatchCode", new { BatchCode = batchCode });
            if (exists == 0) break;
            batchCode = BatchCodeGenerator.Generate();
        }

        var batchId = await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO dispatch_batches
                (batch_code, dispatched_by, from_state_id, from_district_id, to_state_id, to_district_id,
                 expected_arrival, remarks, dispatch_status, total_units)
              OUTPUT INSERTED.batch_id
              VALUES (@BatchCode, @DispatchedBy, @FromStateId, @FromDistrictId, @ToStateId, @ToDistrictId,
                @ExpectedArrival, @Remarks, 'IN_TRANSIT', @TotalUnits)",
            new
            {
                BatchCode = batchCode,
                batch.DispatchedBy, batch.FromStateId, batch.FromDistrictId,
                batch.ToStateId, batch.ToDistrictId, batch.ExpectedArrival,
                batch.Remarks, batch.TotalUnits
            });

        return (batchId, batchCode);
    }

    public async Task AddItemsToBatchAsync(int batchId, List<int> unitIds)
    {
        using var conn = _db.CreateConnection();
        for (int i = 0; i < unitIds.Count; i++)
        {
            var boxNum = (i / 10) + 1;
            var boxName = $"Box {boxNum}";
            await conn.ExecuteAsync(
                "INSERT INTO dispatch_items (batch_id, unit_id, item_status, remarks) VALUES (@BatchId, @UnitId, 'DISPATCHED', @Remarks)",
                new { BatchId = batchId, UnitId = unitIds[i], Remarks = boxName });
        }
    }

    public async Task<DispatchBatch?> GetBatchByIdAsync(int batchId)
    {
        using var conn = _db.CreateConnection();
        var batch = await conn.QueryFirstOrDefaultAsync<DispatchBatch>(
            @"SELECT b.batch_id AS BatchId, b.batch_code AS BatchCode, b.dispatch_date AS DispatchDate,
                     b.expected_arrival AS ExpectedArrival, b.actual_arrival AS ActualArrival,
                     b.dispatch_status AS DispatchStatus, b.total_units AS TotalUnits, b.remarks AS Remarks,
                     b.dispatched_by AS DispatchedBy, b.from_state_id AS FromStateId, b.from_district_id AS FromDistrictId,
                     b.to_state_id AS ToStateId, b.to_district_id AS ToDistrictId, b.received_by AS ReceivedBy,
                     b.created_at AS CreatedAt, b.updated_at AS UpdatedAt,
                     u.full_name AS DispatchedByName, u.user_code AS DispatchedByCode,
                     fs.state_name AS FromStateName, fd.district_name AS FromDistrictName,
                     ts.state_name AS ToStateName, td.district_name AS ToDistrictName,
                     ru.full_name AS ReceivedByName
              FROM dispatch_batches b
              JOIN users u ON b.dispatched_by = u.user_id
              JOIN states fs ON b.from_state_id = fs.state_id
              LEFT JOIN districts fd ON b.from_district_id = fd.district_id
              JOIN states ts ON b.to_state_id = ts.state_id
              LEFT JOIN districts td ON b.to_district_id = td.district_id
              LEFT JOIN users ru ON b.received_by = ru.user_id
              WHERE b.batch_id = @BatchId",
            new { BatchId = batchId });

        if (batch == null) return null;

        batch.Items = (await conn.QueryAsync<DispatchItem>(
            @"SELECT di.item_id AS ItemId, di.batch_id AS BatchId, di.unit_id AS UnitId,
                     di.item_status AS ItemStatus, di.received_at AS ReceivedAt,
                     di.condition_on_receipt AS ConditionOnReceipt, di.remarks AS Remarks,
                     di.created_at AS CreatedAt, di.updated_at AS UpdatedAt,
                     e.unit_code AS UnitCode, e.unit_type AS UnitType, e.serial_number AS SerialNumber,
                     e.manufacturer AS Manufacturer, e.manufacturing_year AS ManufacturingYear
              FROM dispatch_items di
              JOIN evm_units e ON di.unit_id = e.unit_id
              WHERE di.batch_id = @BatchId",
            new { BatchId = batchId })).ToList();

        return batch;
    }

    public async Task<(List<DispatchBatch> Batches, int Total)> ListBatchesAsync(Dictionary<string, object?> filters, int page, int limit)
    {
        var conditions = new List<string> { "1=1" };
        var parameters = new DynamicParameters();

        if (filters.TryGetValue("FromStateId", out var fs) && fs != null) { conditions.Add("b.from_state_id = @FromStateId"); parameters.Add("FromStateId", fs); }
        if (filters.TryGetValue("FromDistrictId", out var fd) && fd != null) { conditions.Add("b.from_district_id = @FromDistrictId"); parameters.Add("FromDistrictId", fd); }
        if (filters.TryGetValue("ToStateId", out var ts) && ts != null) { conditions.Add("b.to_state_id = @ToStateId"); parameters.Add("ToStateId", ts); }
        if (filters.TryGetValue("ToDistrictId", out var td) && td != null) { conditions.Add("b.to_district_id = @ToDistrictId"); parameters.Add("ToDistrictId", td); }
        if (filters.TryGetValue("Status", out var st) && st != null) { conditions.Add("b.dispatch_status = @Status"); parameters.Add("Status", st); }
        if (filters.TryGetValue("DateFrom", out var df) && df != null) { conditions.Add("b.dispatch_date >= @DateFrom"); parameters.Add("DateFrom", df); }
        if (filters.TryGetValue("DateTo", out var dt) && dt != null) { conditions.Add("b.dispatch_date <= @DateTo"); parameters.Add("DateTo", dt); }

        var where = string.Join(" AND ", conditions);
        parameters.Add("Offset", (page - 1) * limit);
        parameters.Add("Limit", limit);

        using var conn = _db.CreateConnection();
        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM dispatch_batches b WHERE {where}", parameters);
        var batches = (await conn.QueryAsync<DispatchBatch>(
            $@"SELECT b.batch_id AS BatchId, b.batch_code AS BatchCode, b.dispatch_date AS DispatchDate,
                      b.expected_arrival AS ExpectedArrival, b.actual_arrival AS ActualArrival,
                      b.dispatch_status AS DispatchStatus, b.total_units AS TotalUnits, b.remarks AS Remarks,
                      u.full_name AS DispatchedByName,
                      fs.state_name AS FromStateName, fd.district_name AS FromDistrictName,
                      ts.state_name AS ToStateName, td.district_name AS ToDistrictName
               FROM dispatch_batches b
               JOIN users u ON b.dispatched_by = u.user_id
               JOIN states fs ON b.from_state_id = fs.state_id
               LEFT JOIN districts fd ON b.from_district_id = fd.district_id
               JOIN states ts ON b.to_state_id = ts.state_id
               LEFT JOIN districts td ON b.to_district_id = td.district_id
               WHERE {where}
               ORDER BY b.dispatch_date DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY", parameters)).ToList();

        return (batches, total);
    }

    public async Task<List<DispatchBatch>> GetPendingReceivablesAsync(int stateId, int? districtId)
    {
        var conditions = new List<string>
        {
            "b.dispatch_status IN ('IN_TRANSIT', 'PARTIALLY_RECEIVED')",
            "b.to_state_id = @StateId"
        };
        var parameters = new DynamicParameters();
        parameters.Add("StateId", stateId);

        if (districtId.HasValue)
        {
            conditions.Add("b.to_district_id = @DistrictId");
            parameters.Add("DistrictId", districtId.Value);
            conditions.Add("NOT (b.from_state_id = @StateId AND b.from_district_id = @DistrictId)");
        }
        else
        {
            conditions.Add("b.to_district_id IS NULL");
            conditions.Add("NOT (b.from_state_id = @StateId AND b.from_district_id IS NULL)");
        }

        using var conn = _db.CreateConnection();
        return (await conn.QueryAsync<DispatchBatch>(
            $@"SELECT b.batch_id AS BatchId, b.batch_code AS BatchCode, b.dispatch_date AS DispatchDate,
                      b.expected_arrival AS ExpectedArrival, b.dispatch_status AS DispatchStatus, b.total_units AS TotalUnits,
                      b.remarks AS Remarks,
                      u.full_name AS DispatchedByName,
                      fs.state_name AS FromStateName, fd.district_name AS FromDistrictName,
                      DATEDIFF(DAY, b.dispatch_date, GETDATE()) AS DaysPending
               FROM dispatch_batches b
               JOIN users u ON b.dispatched_by = u.user_id
               JOIN states fs ON b.from_state_id = fs.state_id
               LEFT JOIN districts fd ON b.from_district_id = fd.district_id
               WHERE {string.Join(" AND ", conditions)}
               ORDER BY b.dispatch_date ASC", parameters)).ToList();
    }

    public async Task UpdateBatchOnReceiptAsync(int batchId, int receivedById, bool allReceived)
    {
        var newStatus = allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE dispatch_batches SET dispatch_status = @Status, actual_arrival = GETDATE(), received_by = @RecBy, updated_at = GETDATE() WHERE batch_id = @BatchId",
            new { BatchId = batchId, Status = newStatus, RecBy = receivedById });
    }

    public async Task UpdateDispatchItemAsync(int itemId, string itemStatus, string? conditionOnReceipt, string? remarks)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE dispatch_items SET item_status = @Status, condition_on_receipt = @Condition,
                remarks = @Remarks, received_at = GETDATE(), updated_at = GETDATE()
              WHERE item_id = @ItemId",
            new { ItemId = itemId, Status = itemStatus, Condition = conditionOnReceipt, Remarks = remarks });
    }

    public async Task CancelBatchAsync(int batchId, string? reason)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE dispatch_batches SET dispatch_status = 'CANCELLED', remarks = @Reason, updated_at = GETDATE() WHERE batch_id = @BatchId",
            new { BatchId = batchId, Reason = reason });
    }
}
