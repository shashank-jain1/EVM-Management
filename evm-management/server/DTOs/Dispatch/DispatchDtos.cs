namespace EVMManagement.Api.DTOs.Dispatch;

public class CreateDispatchRequest
{
    public int ToStateId { get; set; }
    public int? ToDistrictId { get; set; }
    public List<string> UnitCodes { get; set; } = new();
    public DateTime? ExpectedArrival { get; set; }
    public string? Remarks { get; set; }
}

public class ReceiveItemRequest
{
    public int UnitId { get; set; }
    public string ItemStatus { get; set; } = "RECEIVED"; // RECEIVED | MISSING | DAMAGED
    public string? ConditionOnReceipt { get; set; } // GOOD | DAMAGED | FAULTY
    public string? Remarks { get; set; }
}

public class ReceiveDispatchRequest
{
    public List<ReceiveItemRequest> Receipts { get; set; } = new();
}

public class DispatchListFilter
{
    public int? FromStateId { get; set; }
    public int? FromDistrictId { get; set; }
    public int? ToStateId { get; set; }
    public int? ToDistrictId { get; set; }
    public string? Status { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class CancelDispatchRequest
{
    public string? Reason { get; set; }
}
