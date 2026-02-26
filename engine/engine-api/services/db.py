"""
DB 연결 유틸리티
WHY: 엔진은 직접 PostgreSQL에서 데이터를 읽어 평가를 수행
"""
import os
import psycopg2
from contextlib import contextmanager

def get_db_config():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "user": os.getenv("DB_USER", "itadx"),
        "password": os.getenv("DB_PASS", "itadx_dev"),
        "dbname": os.getenv("DB_NAME", "itadx_mvp"),
    }

@contextmanager
def get_connection():
    conn = psycopg2.connect(**get_db_config())
    try:
        yield conn
    finally:
        conn.close()
