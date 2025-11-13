"""
Migration script to add new columns to display_configs table.
Run this script once to update existing database.
"""
import sqlite3
import sys

def migrate_database(db_path='turnotec.db'):
    """Add new columns to display_configs table."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        columns_to_add = [
            ("subtitle_text", "VARCHAR(200) DEFAULT 'Farmacie di turno'"),
            ("theme", "VARCHAR(20) DEFAULT 'light'"),
            ("primary_color", "VARCHAR(7) DEFAULT '#0066CC'"),
            ("secondary_color", "VARCHAR(7) DEFAULT '#00A3E0'"),
        ]

        for column_name, column_def in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE display_configs ADD COLUMN {column_name} {column_def}")
                print(f"✓ Added {column_name} column")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"⊘ Column {column_name} already exists")
                else:
                    print(f"✗ Error adding {column_name}: {e}")

        # Update existing records with default values
        cursor.execute("""
            UPDATE display_configs
            SET subtitle_text = COALESCE(subtitle_text, 'Farmacie di turno'),
                theme = COALESCE(theme, 'light'),
                primary_color = COALESCE(primary_color, '#0066CC'),
                secondary_color = COALESCE(secondary_color, '#00A3E0')
        """)

        updated = cursor.rowcount
        conn.commit()
        conn.close()

        print(f"\n✅ Migration completed successfully!")
        print(f"   Updated {updated} existing record(s)")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_database()
