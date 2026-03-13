using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyFlowApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGoalContributions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GoalContributions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoalId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ContributionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LedgerId = table.Column<int>(type: "int", nullable: true),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoalContributions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoalContributions_Goals_GoalId",
                        column: x => x.GoalId,
                        principalTable: "Goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GoalContributions_Ledgers_LedgerId",
                        column: x => x.LedgerId,
                        principalTable: "Ledgers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_GoalContributions_GoalId",
                table: "GoalContributions",
                column: "GoalId");

            migrationBuilder.CreateIndex(
                name: "IX_GoalContributions_LedgerId",
                table: "GoalContributions",
                column: "LedgerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GoalContributions");
        }
    }
}
