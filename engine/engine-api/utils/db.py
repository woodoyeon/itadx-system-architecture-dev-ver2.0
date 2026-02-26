"""
DB Connection utility

WHY: Engine은 Nest.js(TypeORM)와 별개로 직접 DB 접속
psycopg2로 raw SQL 실행 (Pandas 연동 편의성)
"""
import os
import psycopg2

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "itadx"),
        password=os.getenv("DB_PASS", "itadx_dev"),
        database=os.getenv("DB_NAME", "itadx_mvp"),
    )
