using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyFlowApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLedgerIdToGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LedgerId",
                table: "Goals",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Goals_LedgerId",
                table: "Goals",
                column: "LedgerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Goals_Ledgers_LedgerId",
                table: "Goals",
                column: "LedgerId",
                principalTable: "Ledgers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Goals_Ledgers_LedgerId",
                table: "Goals");

            migrationBuilder.DropIndex(
                name: "IX_Goals_LedgerId",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "LedgerId",
                table: "Goals");
        }
    }
}
