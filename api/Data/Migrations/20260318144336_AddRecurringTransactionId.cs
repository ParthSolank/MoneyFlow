using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyFlowApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringTransactionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RecurringTransactionId",
                table: "Transactions",
                type: "int",
                nullable: true);

            // InitialBalance already exists in database (likely added manually).
            // migrationBuilder.AddColumn<decimal>(
            //     name: "InitialBalance",
            //     table: "Ledgers",
            //     type: "decimal(18,2)",
            //     precision: 18,
            //     scale: 2,
            //     nullable: false,
            //     defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecurringTransactionId",
                table: "Transactions");

            // migrationBuilder.DropColumn(
            //     name: "InitialBalance",
            //     table: "Ledgers");
        }
    }
}
