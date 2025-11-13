"""
Script to fix display_id issue in pharmacies table.

This script:
1. Checks if display_id column exists
2. Generates unique display_id for all pharmacies that don't have one
3. Updates the alembic version table to mark the migration as complete
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text, inspect
from app.database import engine, SessionLocal
from app.models.pharmacy import Pharmacy
from app.utils.display_id import generate_display_id


def fix_display_ids():
    """Fix display_id values for all pharmacies."""

    db = SessionLocal()

    try:
        # Check if column exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('pharmacies')]

        print(f"Columns in pharmacies table: {columns}")

        if 'display_id' not in columns:
            print("❌ display_id column does not exist. Please run the migration first.")
            return False

        # Get all pharmacies
        pharmacies = db.query(Pharmacy).all()
        print(f"\nFound {len(pharmacies)} pharmacies")

        # Check which ones need display_id
        needs_update = [p for p in pharmacies if not p.display_id]
        print(f"Pharmacies without display_id: {len(needs_update)}")

        if needs_update:
            print("\nGenerating display_ids...")
            for pharmacy in needs_update:
                display_id = generate_display_id(db)
                pharmacy.display_id = display_id
                print(f"  - {pharmacy.name}: {display_id}")

            db.commit()
            print("\n✅ All pharmacies now have display_ids!")
        else:
            print("\n✅ All pharmacies already have display_ids")

        # Now mark the migration as complete
        print("\nMarking migration as complete...")
        db.execute(text(
            "INSERT OR IGNORE INTO alembic_version (version_num) VALUES ('a1b2c3d4e5f6')"
        ))
        db.commit()
        print("✅ Migration marked as complete")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Fixing display_id issue...")
    print("=" * 60)

    success = fix_display_ids()

    if success:
        print("\n" + "=" * 60)
        print("✅ Fix completed successfully!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("❌ Fix failed")
        print("=" * 60)
        sys.exit(1)
