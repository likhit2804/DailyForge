import psycopg2

conn = psycopg2.connect(dbname='mydb', user='postgres', password='1234567890', host='localhost')
cur = conn.cursor()
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public';")
tables = cur.fetchall()
print("Tables in database:", tables)
conn.close()
