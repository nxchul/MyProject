#!/usr/bin/env python3
"""
Database initialization script for manual labeling tool
Creates required tables if they don't exist
"""

import sqlite3
import os

def create_database():
    """Create the database and required tables"""
    db_path = "./peak_dip_events.db"
    
    # Create database connection
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Creating database tables...")
    
    # Create peak_dip_events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS peak_dip_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            detect_time DATETIME NOT NULL,
            type TEXT NOT NULL,
            price REAL NOT NULL,
            confidence REAL DEFAULT 1.0,
            source TEXT DEFAULT 'ml_prediction',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            detect_time DATETIME NOT NULL,
            is_valid_peak_dip BOOLEAN,
            trend_label TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(symbol, detect_time)
        )
    """)
    
    # Create labeling_features table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS labeling_features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            price REAL NOT NULL,
            rsi_14 REAL,
            macd_line REAL,
            macd_signal REAL,
            macd_histogram REAL,
            bb_upper REAL,
            bb_middle REAL,
            bb_lower REAL,
            volume_sma_20 REAL,
            price_sma_20 REAL,
            price_ema_12 REAL,
            price_ema_26 REAL,
            stoch_k REAL,
            stoch_d REAL,
            atr_14 REAL,
            williams_r REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert some sample data for testing
    cursor.execute("""
        INSERT OR IGNORE INTO peak_dip_events 
        (symbol, detect_time, type, price, confidence, source)
        VALUES 
        ('BTC', '2024-01-01 10:00:00', 'peak', 45000.0, 0.95, 'ml_prediction'),
        ('BTC', '2024-01-01 14:00:00', 'dip', 44000.0, 0.85, 'ml_prediction'),
        ('ETH', '2024-01-01 11:00:00', 'peak', 2800.0, 0.90, 'ml_prediction'),
        ('ETH', '2024-01-01 15:00:00', 'dip', 2700.0, 0.88, 'ml_prediction')
    """)
    
    # Insert corresponding events
    cursor.execute("""
        INSERT OR IGNORE INTO events 
        (symbol, detect_time, is_valid_peak_dip, trend_label)
        VALUES 
        ('BTC', '2024-01-01 10:00:00', 1, 'uptrend'),
        ('BTC', '2024-01-01 14:00:00', 1, 'downtrend'),
        ('ETH', '2024-01-01 11:00:00', 1, 'uptrend'),
        ('ETH', '2024-01-01 15:00:00', 0, 'sideways')
    """)
    
    conn.commit()
    conn.close()
    
    print("✅ Database created successfully!")
    print(f"Database path: {os.path.abspath(db_path)}")
    
    # Show table info
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables created: {[table[0] for table in tables]}")
    
    # Show sample data
    cursor.execute("SELECT COUNT(*) FROM peak_dip_events")
    count = cursor.fetchone()[0]
    print(f"Sample events inserted: {count}")
    
    conn.close()

if __name__ == "__main__":
    create_database()