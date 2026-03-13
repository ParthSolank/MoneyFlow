using System;
using System.IO;
using System.Data;
using ExcelDataReader;

class Program
{
    static void Main(string[] args)
    {
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
        string filePath = @"d:\Parth\New folder (2)\firebace-main\firebace-main\Acct_Statement_XXXXXXXX5749_26022026.xls";
        using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
        {
            using (var reader = ExcelReaderFactory.CreateReader(stream))
            {
                var result = reader.AsDataSet();
                var table = result.Tables[0];
                var lines = new System.Collections.Generic.List<string>();
                int maxRows = Math.Min(50, table.Rows.Count);
                for (int i = 0; i < maxRows; i++)
                {
                    var row = table.Rows[i];
                    string line = "";
                    for (int j = 0; j < table.Columns.Count; j++)
                    {
                        line += $"[{row[j]}]\t";
                    }
                    lines.Add(line);
                }
                File.WriteAllLines("output.txt", lines);
            }
        }
    }
}
