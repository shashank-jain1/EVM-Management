namespace EVMManagement.Api.DTOs;

/// <summary>
/// Standard API response envelope
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public PaginationMeta? Pagination { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "", PaginationMeta? pagination = null) =>
        new() { Success = true, Data = data, Message = message, Pagination = pagination };

    public static ApiResponse<T> Fail(string message) =>
        new() { Success = false, Message = message };
}

public class ApiErrorResponse
{
    public bool Success { get; set; } = false;
    public ApiError Error { get; set; } = new();
}

public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<FieldError> Details { get; set; } = new();
}

public class FieldError
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class PaginationMeta
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalPages { get; set; }
}
