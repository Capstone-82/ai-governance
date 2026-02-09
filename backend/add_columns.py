
import sqlite3

def add_columns():
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        # Add query_category column
        try:
            cursor.execute("ALTER TABLE governancetelemetry ADD COLUMN query_category TEXT")
            print("Added query_category column.")
        except sqlite3.OperationalError as e:
            print(f"Adding query_category failed (maybe it already exists?): {e}")
            
        # Add prompt_optimization column
        try:
            cursor.execute("ALTER TABLE governancetelemetry ADD COLUMN prompt_optimization TEXT")
            print("Added prompt_optimization column.")
        except sqlite3.OperationalError as e:
            print(f"Adding prompt_optimization failed (maybe it already exists?): {e}")
            
        conn.commit()
        conn.close()
        print("Database schema updated successfully.")
        
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    add_columns()
