using EVMManagement.Api.DTOs.Dispatch;
using EVMManagement.Api.Models;
using EVMManagement.Api.Repositories;
using EVMManagement.Api.Utils;

namespace EVMManagement.Api.Services;

public interface IDispatchService
{
    Task<DispatchBatch> InitiateDispatchAsync(int userId, int fromStateId, int? fromDistrictId, CreateDispatchRequest request, string? ipAddress, string? userAgent);
    Task<DispatchBatch> ReceiveDispatchAsync(int userId, int userStateId, int? userDistrictId, int batchId, ReceiveDispatchRequest request, string? ipAddress, string? userAgent);
    Task<DispatchBatch?> GetBatchAsync(int batchId);
    Task<(List<DispatchBatch> Batches, int Total)> ListBatchesAsync(DispatchListFilter filter);
    Task<List<DispatchBatch>> GetPendingReceivablesAsync(int stateId, int? districtId);
    Task CancelBatchAsync(int adminId, int batchId, string? reason, string? ipAddress, string? userAgent);
}

public class DispatchService : IDispatchService
{
    private readonly IDispatchRepository _dispatchRepo;
    private readonly IEvmRepository _evmRepo;
    private readonly IAuditLogger _audit;

    public DispatchService(IDispatchRepository dispatchRepo, IEvmRepository evmRepo, IAuditLogger audit)
    {
        _dispatchRepo = dispatchRepo;
        _evmRepo = evmRepo;
        _audit = audit;
    }

    public async Task<DispatchBatch> InitiateDispatchAsync(int userId, int fromStateId, int? fromDistrictId, CreateDispatchRequest request, string? ipAddress, string? userAgent)
    {
        // Validate all unit codes exist and are not already IN_TRANSIT
        var unitIds = new List<int>();
        var invalidUnits = new List<string>();
        var inTransitUnits = new List<string>();

        foreach (var code in request.UnitCodes)
        {
            var unit = await _evmRepo.FindByCodeAsync(code);
            if (unit == null) { invalidUnits.Add(code); continue; }
            if (unit.CurrentStatus == "IN_TRANSIT") { inTransitUnits.Add(code); continue; }
            unitIds.Add(unit.UnitId);
        }

        if (invalidUnits.Any())
            throw new BusinessException($"Units not found: {string.Join(", ", invalidUnits)}", "UNITS_NOT_FOUND");
        if (inTransitUnits.Any())
            throw new BusinessException($"Units already in transit: {string.Join(", ", inTransitUnits)}", "UNITS_IN_TRANSIT");

        var batch = new DispatchBatch
        {
            DispatchedBy = userId,
            FromStateId = fromStateId,
            FromDistrictId = fromDistrictId,
            ToStateId = request.ToStateId,
            ToDistrictId = request.ToDistrictId,
            ExpectedArrival = request.ExpectedArrival,
            Remarks = request.Remarks,
            TotalUnits = unitIds.Count,
        };

        var (batchId, batchCode) = await _dispatchRepo.CreateBatchAsync(batch);
        await _dispatchRepo.AddItemsToBatchAsync(batchId, unitIds);

        // Update each unit: status = IN_TRANSIT, add movement history
        foreach (var uid in unitIds)
        {
            var unit = await _evmRepo.FindByIdAsync(uid);
            await _evmRepo.UpdateUnitStatusAsync(uid, "IN_TRANSIT", fromStateId, fromDistrictId, null);
            await _evmRepo.AddMovementHistoryAsync(uid, "DISPATCHED", batchId,
                unit!.CurrentStateId, unit.CurrentDistrictId,
                request.ToStateId, request.ToDistrictId, userId, $"Dispatched in batch {batchCode}");
        }

        await _audit.LogAsync(userId, "DISPATCH_CREATED", "DISPATCH_BATCH", batchId.ToString(),
            null, new { BatchCode = batchCode, TotalUnits = unitIds.Count }, ipAddress, userAgent);

        return (await _dispatchRepo.GetBatchByIdAsync(batchId))!;
    }

    public async Task<DispatchBatch> ReceiveDispatchAsync(int userId, int userStateId, int? userDistrictId, int batchId, ReceiveDispatchRequest request, string? ipAddress, string? userAgent)
    {
        var batch = await _dispatchRepo.GetBatchByIdAsync(batchId)
            ?? throw new NotFoundException("Dispatch batch not found");

        if (batch.ToStateId != userStateId)
            throw new ForbiddenException("This batch is not destined for your state");

        if (batch.DispatchStatus is "RECEIVED" or "CANCELLED")
            throw new BusinessException($"Batch is already {batch.DispatchStatus}", "INVALID_BATCH_STATUS");

        var allReceived = true;

        foreach (var receipt in request.Receipts)
        {
            var item = batch.Items.FirstOrDefault(i => i.UnitId == receipt.UnitId);
            if (item == null) continue;

            await _dispatchRepo.UpdateDispatchItemAsync(item.ItemId, receipt.ItemStatus, receipt.ConditionOnReceipt, receipt.Remarks);

            if (receipt.ItemStatus == "RECEIVED")
            {
                // Update unit location to receiver's state/district
                await _evmRepo.UpdateUnitStatusAsync(receipt.UnitId, "IN_WAREHOUSE", userStateId, userDistrictId, null);
                await _evmRepo.AddMovementHistoryAsync(receipt.UnitId, "RECEIVED", batchId,
                    batch.FromStateId, batch.FromDistrictId,
                    userStateId, userDistrictId, userId, $"Received from batch {batch.BatchCode}");
            }
            else
            {
                allReceived = false;
                // Mark missing units - received units go to IN_WAREHOUSE
                var newStatus = "IN_WAREHOUSE";
                await _evmRepo.UpdateUnitStatusAsync(receipt.UnitId, newStatus, userStateId, userDistrictId, null);
            }
        }

        await _dispatchRepo.UpdateBatchOnReceiptAsync(batchId, userId, allReceived);

        await _audit.LogAsync(userId, "DISPATCH_RECEIVED", "DISPATCH_BATCH", batchId.ToString(),
            new { batch.DispatchStatus }, new { Status = allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED" }, ipAddress, userAgent);

        return (await _dispatchRepo.GetBatchByIdAsync(batchId))!;
    }

    public async Task<DispatchBatch?> GetBatchAsync(int batchId)
        => await _dispatchRepo.GetBatchByIdAsync(batchId);

    public async Task<(List<DispatchBatch> Batches, int Total)> ListBatchesAsync(DispatchListFilter filter)
    {
        var filters = new Dictionary<string, object?>();
        if (filter.FromStateId.HasValue) filters["FromStateId"] = filter.FromStateId;
        if (filter.FromDistrictId.HasValue) filters["FromDistrictId"] = filter.FromDistrictId;
        if (filter.ToStateId.HasValue) filters["ToStateId"] = filter.ToStateId;
        if (filter.ToDistrictId.HasValue) filters["ToDistrictId"] = filter.ToDistrictId;
        if (!string.IsNullOrEmpty(filter.Status)) filters["Status"] = filter.Status;
        if (filter.DateFrom.HasValue) filters["DateFrom"] = filter.DateFrom;
        if (filter.DateTo.HasValue) filters["DateTo"] = filter.DateTo;

        return await _dispatchRepo.ListBatchesAsync(filters, filter.Page, filter.Limit);
    }

    public async Task<List<DispatchBatch>> GetPendingReceivablesAsync(int stateId, int? districtId)
        => await _dispatchRepo.GetPendingReceivablesAsync(stateId, districtId);

    public async Task CancelBatchAsync(int adminId, int batchId, string? reason, string? ipAddress, string? userAgent)
    {
        var batch = await _dispatchRepo.GetBatchByIdAsync(batchId)
            ?? throw new NotFoundException("Dispatch batch not found");

        if (batch.DispatchStatus is "RECEIVED" or "CANCELLED")
            throw new BusinessException($"Cannot cancel a batch that is already {batch.DispatchStatus}", "INVALID_STATUS");

        await _dispatchRepo.CancelBatchAsync(batchId, reason);

        // Revert units back to IN_WAREHOUSE in their previous location
        foreach (var item in batch.Items.Where(i => i.ItemStatus == "DISPATCHED"))
        {
            await _evmRepo.UpdateUnitStatusAsync(item.UnitId, "IN_WAREHOUSE", batch.FromStateId, batch.FromDistrictId, null);
        }

        await _audit.LogAsync(adminId, "DISPATCH_CANCELLED", "DISPATCH_BATCH", batchId.ToString(),
            new { batch.DispatchStatus }, new { Status = "CANCELLED", Reason = reason }, ipAddress, userAgent);
    }
}
