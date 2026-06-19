namespace EVMManagement.Api.Models;

public class EvmUnit
{
    public int UnitId { get; set; }
    public string UnitCode { get; set; } = string.Empty;
    public string UnitType { get; set; } = string.Empty; // CONTROL_UNIT | BALLOT_UNIT | DMM
    public string Manufacturer { get; set; } = string.Empty;
    public int ManufacturingYear { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public int? CurrentStateId { get; set; }
    public int? CurrentDistrictId { get; set; }
    public string? CurrentLocationDescription { get; set; }
    public int? BoxNumber { get; set; }
    public string CurrentStatus { get; set; } = "IN_WAREHOUSE"; // IN_WAREHOUSE | IN_TRANSIT
    public bool IsActive { get; set; } = true;
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Joined fields
    public string? StateName { get; set; }
    public string? StateCode { get; set; }
    public string? DistrictName { get; set; }
    public string? DistrictCode { get; set; }
}

public class DispatchBatch
{
    public int BatchId { get; set; }
    public string BatchCode { get; set; } = string.Empty;
    public int DispatchedBy { get; set; }
    public int FromStateId { get; set; }
    public int? FromDistrictId { get; set; }
    public int ToStateId { get; set; }
    public int? ToDistrictId { get; set; }
    public DateTime DispatchDate { get; set; }
    public DateTime? ExpectedArrival { get; set; }
    public DateTime? ActualArrival { get; set; }
    public string DispatchStatus { get; set; } = "PENDING"; // PENDING | IN_TRANSIT | PARTIALLY_RECEIVED | RECEIVED | CANCELLED
    public string? Remarks { get; set; }
    public int TotalUnits { get; set; }
    public int? ReceivedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Joined fields
    public string? DispatchedByName { get; set; }
    public string? DispatchedByCode { get; set; }
    public string? FromStateName { get; set; }
    public string? FromDistrictName { get; set; }
    public string? ToStateName { get; set; }
    public string? ToDistrictName { get; set; }
    public string? ReceivedByName { get; set; }
    public int? DaysPending { get; set; }

    public List<DispatchItem> Items { get; set; } = new();
}

public class DispatchItem
{
    public int ItemId { get; set; }
    public int BatchId { get; set; }
    public int UnitId { get; set; }
    public string ItemStatus { get; set; } = "DISPATCHED"; // DISPATCHED | RECEIVED | MISSING | DAMAGED
    public DateTime? ReceivedAt { get; set; }
    public string? ConditionOnReceipt { get; set; } // GOOD | DAMAGED | FAULTY
    public int? BoxNumber { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Joined fields
    public string? UnitCode { get; set; }
    public string? UnitType { get; set; }
    public string? SerialNumber { get; set; }
    public string? Manufacturer { get; set; }
    public int? ManufacturingYear { get; set; }
}

public class EvmMovementHistory
{
    public int HistoryId { get; set; }
    public int UnitId { get; set; }
    public string ActionType { get; set; } = string.Empty; // REGISTERED | DISPATCHED | RECEIVED
    public int? BatchId { get; set; }
    public int? FromStateId { get; set; }
    public int? FromDistrictId { get; set; }
    public int? ToStateId { get; set; }
    public int? ToDistrictId { get; set; }
    public int ActionBy { get; set; }
    public DateTime ActionDate { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }

    // Joined fields
    public string? ActionByName { get; set; }
    public string? ActionByCode { get; set; }
    public string? FromStateName { get; set; }
    public string? FromDistrictName { get; set; }
    public string? ToStateName { get; set; }
    public string? ToDistrictName { get; set; }
    public string? BatchCode { get; set; }
}

public class AuditLog
{
    public int LogId { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }

    // Joined
    public string? UserCode { get; set; }
    public string? FullName { get; set; }
}
