namespace EVMManagement.Api.Utils;

public static class BatchCodeGenerator
{
    private const string Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static readonly Random _rng = new();

    public static string Generate()
    {
        var datePart = DateTime.Now.ToString("yyyyMMdd");
        var suffix = new string(Enumerable.Range(0, 4).Select(_ => Chars[_rng.Next(Chars.Length)]).ToArray());
        return $"BATCH-{datePart}-{suffix}";
    }
}
