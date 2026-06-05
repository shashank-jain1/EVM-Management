namespace EVMManagement.Api.DTOs.Evm;

public class CreateEvmRequest
{
    public string UnitCode { get; set; } = string.Empty;
    public string UnitType { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public int ManufacturingYear { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public int StateId { get; set; }
    public int? DistrictId { get; set; }
    public string? LocationDescription { get; set; }
}

public class EvmListFilter
{
    public int? StateId { get; set; }
    public int? DistrictId { get; set; }
    public string? UnitType { get; set; }
    public string? Status { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class UpdateEvmStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public int? StateId { get; set; }
    public int? DistrictId { get; set; }
    public string? LocationDescription { get; set; }
    public string? Remarks { get; set; }
}
