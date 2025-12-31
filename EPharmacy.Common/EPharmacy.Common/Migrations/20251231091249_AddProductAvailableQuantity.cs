using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPharmacy.Common.EPharmacy.Common.Migrations
{
    /// <inheritdoc />
    public partial class AddProductAvailableQuantity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvailableQuantity",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvailableQuantity",
                table: "Products");
        }
    }
}
