import psycopg_pool
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

# Create a psycopg_pool connection pool
my_pool = psycopg_pool.ConnectionPool(
    conninfo="postgresql://scott:tiger@localhost/test",
    close_returns=True,  # Return "closed" active connections to the pool
    # ... other pool parameters as desired ...
)

# Create an engine that uses the connection pool to get a connection
engine = create_engine(
    url="postgresql+psycopg://",  # Only need the dialect now
    poolclass=NullPool,  # Disable SQLAlchemy's default connection pool
    creator=my_pool.getconn,  # Use Psycopg 3 connection pool to obtain connections
)
