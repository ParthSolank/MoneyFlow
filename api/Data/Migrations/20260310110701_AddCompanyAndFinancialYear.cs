using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MoneyFlowApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyAndFinancialYear : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Transactions",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Transactions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Ledgers",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Ledgers",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Transactions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Ledgers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "FinancialYears",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OwnerUserId",
                table: "Companies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "AuditLogs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_CompanyId",
                table: "Transactions",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Ledgers_CompanyId",
                table: "Ledgers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_OwnerUserId",
                table: "Companies",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_CompanyId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Ledgers_CompanyId",
                table: "Ledgers");

            migrationBuilder.DropIndex(
                name: "IX_Companies_OwnerUserId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Ledgers");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "FinancialYears");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "AuditLogs");

            migrationBuilder.InsertData(
                table: "Ledgers",
                columns: new[] { "Id", "AccountType", "Balance", "CreatedAt", "DeletedAt", "Description", "Icon", "IsDeleted", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "bank", 50000.00m, new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Primary savings account", "building-columns", false, "HDFC Bank", new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "credit", -15000.00m, new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Platinum credit card", "credit-card", false, "ICICI Credit Card", new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "Transactions",
                columns: new[] { "Id", "Amount", "Category", "CreatedAt", "Date", "DeletedAt", "Description", "IsDeleted", "LedgerId", "PaymentMethod", "Type", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 75000.00m, "Salary", new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "2026-02-01", null, "Salary", false, 1, "bank", "income", new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, 3500.00m, "Food & Dining", new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "2026-02-05", null, "Grocery Shopping", false, 2, "credit", "expense", new DateTime(2026, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }
    }
}
