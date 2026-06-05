using System.Data;
using Dapper;

namespace EVMManagement.Api.Data;

public static class DbSeeder
{
    public static async Task SeedStatesAndDistrictsAsync(IDbConnection conn)
    {
        var statesList = new List<(string Code, string Name, List<(string Code, string Name)> Districts)>
        {
            // Existing States (MH, UP, MP, RJ, GJ) to keep compatibility
            ("MH", "Maharashtra", new() { ("MH-MUM", "Mumbai"), ("MH-PUN", "Pune"), ("MH-NGP", "Nagpur") }),
            ("UP", "Uttar Pradesh", new() { ("UP-LKO", "Lucknow"), ("UP-AGR", "Agra"), ("UP-VNS", "Varanasi") }),
            ("MP", "Madhya Pradesh", new() { ("MP-BPL", "Bhopal"), ("MP-IND", "Indore"), ("MP-GWL", "Gwalior") }),
            ("RJ", "Rajasthan", new() { ("RJ-JPR", "Jaipur"), ("RJ-JDH", "Jodhpur"), ("RJ-AJM", "Ajmer") }),
            ("GJ", "Gujarat", new() { ("GJ-AMD", "Ahmedabad"), ("GJ-SRT", "Surat"), ("GJ-VDR", "Vadodara") }),
            
            // Other States
            ("AP", "Andhra Pradesh", new() { ("AP-VSP", "Visakhapatnam"), ("AP-VJW", "Vijayawada"), ("AP-GTR", "Guntur") }),
            ("AR", "Arunachal Pradesh", new() { ("AR-ITN", "Itanagar"), ("AR-TWG", "Tawang"), ("AR-CHG", "Changlang") }),
            ("AS", "Assam", new() { ("AS-GWH", "Guwahati"), ("AS-DBR", "Dibrugarh"), ("AS-SLC", "Silchar") }),
            ("BR", "Bihar", new() { ("BR-PAT", "Patna"), ("BR-GAY", "Gaya"), ("BR-BGP", "Bhagalpur") }),
            ("CG", "Chhattisgarh", new() { ("CG-RPR", "Raipur"), ("CG-BSP", "Bilaspur"), ("CG-DRG", "Durg") }),
            ("GA", "Goa", new() { ("GA-NGA", "North Goa"), ("GA-SGA", "South Goa") }),
            ("HR", "Haryana", new() { ("HR-GRG", "Gurugram"), ("HR-FRD", "Faridabad"), ("HR-PPT", "Panipat") }),
            ("HP", "Himachal Pradesh", new() { ("HP-SML", "Shimla"), ("HP-DHS", "Dharamshala"), ("HP-MNL", "Manali") }),
            ("JH", "Jharkhand", new() { ("JH-RNC", "Ranchi"), ("JH-JSP", "Jamshedpur"), ("JH-DNB", "Dhanbad") }),
            ("KA", "Karnataka", new() { ("KA-BLR", "Bengaluru"), ("KA-MYS", "Mysuru"), ("KA-HBL", "Hubli") }),
            ("KL", "Kerala", new() { ("KL-TVM", "Thiruvananthapuram"), ("KL-KOC", "Kochi"), ("KL-KKD", "Kozhikode") }),
            ("MN", "Manipur", new() { ("MN-IPL", "Imphal"), ("MN-UKR", "Ukhrul"), ("MN-BPR", "Bishnupur") }),
            ("ML", "Meghalaya", new() { ("ML-SHG", "Shillong"), ("ML-TUR", "Tura"), ("ML-JOW", "Jowai") }),
            ("MZ", "Mizoram", new() { ("MZ-AZL", "Aizawl"), ("MZ-LGL", "Lunglei"), ("MZ-CMP", "Champhai") }),
            ("NL", "Nagaland", new() { ("NL-KHM", "Kohima"), ("NL-DMP", "Dimapur"), ("NL-MKC", "Mokokchung") }),
            ("OD", "Odisha", new() { ("OD-BBS", "Bhubaneswar"), ("OD-CTC", "Cuttack"), ("OD-RKL", "Rourkela") }),
            ("PB", "Punjab", new() { ("PB-LDH", "Ludhiana"), ("PB-ASR", "Amritsar"), ("PB-JLD", "Jalandhar") }),
            ("SK", "Sikkim", new() { ("SK-GTK", "Gangtok"), ("SK-NMC", "Namchi"), ("SK-GZG", "Geyzing") }),
            ("TN", "Tamil Nadu", new() { ("TN-CHN", "Chennai"), ("TN-CBT", "Coimbatore"), ("TN-MDR", "Madurai") }),
            ("TG", "Telangana", new() { ("TG-HYD", "Hyderabad"), ("TG-WRL", "Warangal"), ("TG-NZB", "Nizamabad") }),
            ("TR", "Tripura", new() { ("TR-AGT", "Agartala"), ("TR-DMN", "Dharmanagar"), ("TR-UDP", "Udaipur") }),
            ("UK", "Uttarakhand", new() { ("UK-DDN", "Dehradun"), ("UK-HDW", "Haridwar"), ("UK-NNT", "Nainital") }),
            ("WB", "West Bengal", new() { ("WB-KOL", "Kolkata"), ("WB-DJL", "Darjeeling"), ("WB-SLG", "Siliguri") }),
            
            // UTs
            ("AN", "Andaman and Nicobar Islands", new() { ("AN-PBR", "Port Blair") }),
            ("CH", "Chandigarh", new() { ("CH-CHD", "Chandigarh") }),
            ("DN", "Dadra and Nagar Haveli and Daman and Diu", new() { ("DN-DMN", "Daman"), ("DN-DIU", "Diu"), ("DN-SLV", "Silvassa") }),
            ("DL", "Delhi", new() { ("DL-NDL", "New Delhi"), ("DL-SDL", "South Delhi"), ("DL-NDL2", "North Delhi") }),
            ("JK", "Jammu and Kashmir", new() { ("JK-SGR", "Srinagar"), ("JK-JMU", "Jammu"), ("JK-ANT", "Anantnag") }),
            ("LA", "Ladakh", new() { ("LA-LEH", "Leh"), ("LA-KRG", "Kargil") }),
            ("LD", "Lakshadweep", new() { ("LD-KVR", "Kavaratti") }),
            ("PY", "Puducherry", new() { ("PY-PDY", "Puducherry"), ("PY-KKL", "Karaikal") })
        };

        foreach (var state in statesList)
        {
            // Check if state exists
            var stateId = await conn.QuerySingleOrDefaultAsync<int?>(
                "SELECT state_id FROM states WHERE state_code = @Code", new { Code = state.Code });

            if (stateId == null)
            {
                stateId = await conn.QuerySingleAsync<int>(
                    "INSERT INTO states (state_code, state_name, is_active, created_at, updated_at) " +
                    "OUTPUT INSERTED.state_id VALUES (@Code, @Name, 1, GETDATE(), GETDATE())",
                    new { Code = state.Code, Name = state.Name });
            }

            foreach (var dist in state.Districts)
            {
                var distId = await conn.QuerySingleOrDefaultAsync<int?>(
                    "SELECT district_id FROM districts WHERE district_code = @Code", new { Code = dist.Code });

                if (distId == null)
                {
                    await conn.ExecuteAsync(
                        "INSERT INTO districts (district_code, district_name, state_id, is_active, created_at, updated_at) " +
                        "VALUES (@Code, @Name, @StateId, 1, GETDATE(), GETDATE())",
                        new { Code = dist.Code, Name = dist.Name, StateId = stateId.Value });
                }
            }
        }
    }
}
