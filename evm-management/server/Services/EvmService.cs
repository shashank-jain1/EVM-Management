using EVMManagement.Api.DTOs.Evm;
using EVMManagement.Api.Models;
using EVMManagement.Api.Repositories;
using EVMManagement.Api.Utils;

namespace EVMManagement.Api.Services;

public interface IEvmService
{
    Task<EvmUnit> RegisterUnitAsync(int userId, CreateEvmRequest request, string? ipAddress, string? userAgent);
    Task<EvmUnit?> LookupByCodeAsync(string unitCode);
    Task<(List<EvmUnit> Units, int Total)> ListUnitsAsync(EvmListFilter filter);
    Task<EvmUnit> GetUnitDetailAsync(int unitId);
    Task<List<EvmMovementHistory>> GetUnitHistoryAsync(int unitId);
    Task<EvmUnit> UpdateStatusAsync(int adminId, int unitId, UpdateEvmStatusRequest request, string? ipAddress, string? userAgent);
}

public class EvmService : IEvmService
{
    private readonly IEvmRepository _evmRepo;
    private readonly IAuditLogger _audit;

    public EvmService(IEvmRepository evmRepo, IAuditLogger audit)
    {
        _evmRepo = evmRepo;
        _audit = audit;
    }

    public async Task<EvmUnit> RegisterUnitAsync(int userId, CreateEvmRequest request, string? ipAddress, string? userAgent)
    {
        var existing = await _evmRepo.FindByCodeAsync(request.UnitCode);
        if (existing != null) throw new ConflictException("Unit code already exists");

        var unit = new EvmUnit
        {
            UnitCode = request.UnitCode,
            UnitType = request.UnitType,
            Manufacturer = request.Manufacturer,
            ManufacturingYear = request.ManufacturingYear,
            SerialNumber = request.SerialNumber,
            CurrentStateId = request.StateId,
            CurrentDistrictId = request.DistrictId,
            CurrentLocationDescription = request.LocationDescription,
        };

        var unitId = await _evmRepo.CreateUnitAsync(unit, userId);

        // Insert initial movement history
        await _evmRepo.AddMovementHistoryAsync(
            unitId, "REGISTERED", null, null, null,
            request.StateId, request.DistrictId, userId, "Initial registration");

        await _audit.LogAsync(userId, "EVM_REGISTERED", "EVM_UNIT", unitId.ToString(),
            null, new { request.UnitCode, request.UnitType }, ipAddress, userAgent);

        return (await _evmRepo.FindByIdAsync(unitId))!;
    }

    public async Task<EvmUnit?> LookupByCodeAsync(string unitCode)
        => await _evmRepo.FindByCodeAsync(unitCode);

    public async Task<(List<EvmUnit> Units, int Total)> ListUnitsAsync(EvmListFilter filter)
    {
        var filters = new Dictionary<string, object?>();
        if (filter.StateId.HasValue) filters["StateId"] = filter.StateId;
        if (filter.DistrictId.HasValue) filters["DistrictId"] = filter.DistrictId;
        if (!string.IsNullOrEmpty(filter.UnitType)) filters["UnitType"] = filter.UnitType;
        if (!string.IsNullOrEmpty(filter.Status)) filters["Status"] = filter.Status;
        if (!string.IsNullOrEmpty(filter.Search)) filters["Search"] = filter.Search;

        return await _evmRepo.ListUnitsAsync(filters, filter.Page, filter.Limit);
    }

    public async Task<EvmUnit> GetUnitDetailAsync(int unitId)
        => await _evmRepo.FindByIdAsync(unitId) ?? throw new NotFoundException("EVM unit not found");

    public async Task<List<EvmMovementHistory>> GetUnitHistoryAsync(int unitId)
    {
        _ = await _evmRepo.FindByIdAsync(unitId) ?? throw new NotFoundException("EVM unit not found");
        return await _evmRepo.GetUnitHistoryAsync(unitId);
    }

    public async Task<EvmUnit> UpdateStatusAsync(int adminId, int unitId, UpdateEvmStatusRequest request, string? ipAddress, string? userAgent)
    {
        var unit = await _evmRepo.FindByIdAsync(unitId) ?? throw new NotFoundException("EVM unit not found");
        var oldStatus = unit.CurrentStatus;

        await _evmRepo.UpdateUnitStatusAsync(unitId, request.Status, request.StateId, request.DistrictId, request.LocationDescription);
        await _evmRepo.AddMovementHistoryAsync(unitId, MapStatusToAction(request.Status), null,
            unit.CurrentStateId, unit.CurrentDistrictId, request.StateId, request.DistrictId, adminId, request.Remarks);

        await _audit.LogAsync(adminId, "EVM_STATUS_UPDATED", "EVM_UNIT", unitId.ToString(),
            new { Status = oldStatus }, new { Status = request.Status }, ipAddress, userAgent);

        return (await _evmRepo.FindByIdAsync(unitId))!;
    }

    private static string MapStatusToAction(string status) => status switch
    {
        "DEPLOYED" => "DEPLOYED",
        "RETURNED" => "RETURNED",
        "FAULTY" => "REPORTED_FAULTY",
        "DECOMMISSIONED" => "DECOMMISSIONED",
        _ => "DISPATCHED",
    };
}
