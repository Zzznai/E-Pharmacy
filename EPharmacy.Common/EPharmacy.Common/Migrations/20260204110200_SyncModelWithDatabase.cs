using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EPharmacy.Common.EPharmacy.Common.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelWithDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This migration syncs the model snapshot with the actual database state.
            // No database changes needed.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No changes to reverse.
        }
    }
}
