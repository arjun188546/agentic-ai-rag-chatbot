# Database Design and Management

## Database Fundamentals

### What is a Database?
A database is an organized collection of structured information, or data, typically stored electronically in a computer system. It is controlled by a database management system (DBMS), which provides an interface for users and applications to interact with the data.

### Database Models
1. **Hierarchical Model**: Tree-like structure with parent-child relationships
2. **Network Model**: Graph structure allowing multiple parent-child relationships
3. **Relational Model**: Data organized in tables with relationships between them
4. **Object-Oriented Model**: Data stored as objects with attributes and methods
5. **NoSQL Models**: Document, key-value, column-family, and graph databases

## Relational Database Design

### Entity-Relationship (ER) Modeling
**Entities**: Real-world objects or concepts (Customer, Order, Product)
**Attributes**: Properties of entities (CustomerID, Name, Email)
**Relationships**: Associations between entities (Customer places Order)

**Relationship Types:**
- **One-to-One (1:1)**: Each entity in A relates to exactly one entity in B
- **One-to-Many (1:M)**: Each entity in A can relate to multiple entities in B
- **Many-to-Many (M:M)**: Multiple entities in A can relate to multiple entities in B

### Normalization
Process of organizing data to reduce redundancy and improve data integrity.

**First Normal Form (1NF):**
- Each column contains atomic (indivisible) values
- Each column contains values of single type
- Each column has unique name
- Order of data storage doesn't matter

**Second Normal Form (2NF):**
- Must be in 1NF
- All non-key attributes must be fully functionally dependent on primary key
- Eliminate partial dependencies

**Third Normal Form (3NF):**
- Must be in 2NF
- No transitive dependencies
- Non-key attributes must not depend on other non-key attributes

**Boyce-Codd Normal Form (BCNF):**
- Stricter version of 3NF
- Every determinant must be a candidate key

### Primary and Foreign Keys
**Primary Key**: Unique identifier for each record in table
- Must be unique and not null
- Should be stable (not change frequently)
- Prefer surrogate keys (auto-generated) over natural keys

**Foreign Key**: Field that references primary key of another table
- Enforces referential integrity
- Can be null (unless specified otherwise)
- Should have indexes for performance

### Indexing Strategies
**Types of Indexes:**
- **Clustered Index**: Physical order of data matches index order
- **Non-Clustered Index**: Logical order independent of physical order
- **Unique Index**: Ensures uniqueness of indexed columns
- **Composite Index**: Multiple columns combined in single index

**Index Selection Guidelines:**
- Index frequently queried columns
- Index foreign key columns
- Index columns used in ORDER BY clauses
- Avoid over-indexing (impacts INSERT/UPDATE performance)
- Consider covering indexes for specific queries

## SQL Fundamentals

### Data Definition Language (DDL)
```sql
-- Create table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modify table structure
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
ALTER TABLE customers DROP COLUMN phone;

-- Create index
CREATE INDEX idx_customer_email ON customers(email);

-- Drop table
DROP TABLE customers;
```

### Data Manipulation Language (DML)
```sql
-- Insert data
INSERT INTO customers (first_name, last_name, email)
VALUES ('John', 'Doe', 'john.doe@email.com');

-- Update data
UPDATE customers 
SET email = 'john.smith@email.com'
WHERE customer_id = 1;

-- Delete data
DELETE FROM customers WHERE customer_id = 1;

-- Select data
SELECT first_name, last_name, email
FROM customers
WHERE created_at >= '2023-01-01'
ORDER BY last_name, first_name;
```

### Advanced SQL Queries
```sql
-- Joins
SELECT c.first_name, c.last_name, o.order_date, o.total_amount
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2023-01-01';

-- Subqueries
SELECT first_name, last_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders
    WHERE total_amount > 1000
);

-- Window functions
SELECT 
    customer_id,
    order_date,
    total_amount,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as order_sequence
FROM orders;

-- Common Table Expressions (CTEs)
WITH monthly_sales AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(total_amount) as total_sales
    FROM orders
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT month, total_sales,
       LAG(total_sales) OVER (ORDER BY month) as previous_month_sales
FROM monthly_sales;
```

## NoSQL Databases

### Document Databases
**Examples**: MongoDB, CouchDB, Amazon DocumentDB
**Structure**: Store data as documents (JSON, BSON, XML)
**Use Cases**: Content management, catalogs, user profiles

**Example MongoDB Document:**
```json
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john.doe@email.com",
  "addresses": [
    {
      "type": "home",
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345"
    }
  ],
  "orders": [
    {
      "order_id": "ORD001",
      "date": "2023-01-15",
      "items": [...]
    }
  ]
}
```

### Key-Value Stores
**Examples**: Redis, Amazon DynamoDB, Riak
**Structure**: Simple key-value pairs
**Use Cases**: Caching, session storage, shopping carts

### Column-Family Databases
**Examples**: Cassandra, HBase, Amazon SimpleDB
**Structure**: Column families contain rows with variable columns
**Use Cases**: Time-series data, logging, analytics

### Graph Databases
**Examples**: Neo4j, Amazon Neptune, ArangoDB
**Structure**: Nodes and edges representing entities and relationships
**Use Cases**: Social networks, recommendation engines, fraud detection

## Database Performance Optimization

### Query Optimization
1. **Use Indexes Effectively**
   - Create indexes on frequently queried columns
   - Use covering indexes when possible
   - Monitor index usage and remove unused indexes

2. **Write Efficient Queries**
   - Avoid SELECT * in production code
   - Use appropriate JOINs instead of subqueries when possible
   - Use LIMIT to restrict result sets
   - Filter early with WHERE clauses

3. **Analyze Execution Plans**
   - Use EXPLAIN to understand query execution
   - Identify table scans and optimize them
   - Look for expensive operations

### Database Tuning
**Memory Configuration:**
- Buffer pool size (InnoDB)
- Query cache settings
- Connection pool sizing

**Disk I/O Optimization:**
- Use SSDs for better performance
- Separate data and log files
- Configure appropriate page sizes

**Connection Management:**
- Use connection pooling
- Set appropriate timeout values
- Monitor connection usage

### Monitoring and Maintenance
**Key Metrics:**
- Query response times
- Throughput (queries per second)
- Connection usage
- Buffer hit ratios
- Disk I/O statistics

**Regular Maintenance:**
- Update table statistics
- Rebuild fragmented indexes
- Purge old log files
- Monitor storage space

## Database Security

### Access Control
**Authentication**: Verify user identity
- Strong passwords or multi-factor authentication
- Certificate-based authentication
- Integration with directory services (LDAP, Active Directory)

**Authorization**: Control what authenticated users can do
- Role-based access control (RBAC)
- Principle of least privilege
- Grant specific permissions on objects

### Data Protection
**Encryption at Rest**: Protect stored data
- Transparent data encryption (TDE)
- File system encryption
- Application-level encryption

**Encryption in Transit**: Protect data in motion
- SSL/TLS for client connections
- Encrypted backup transfers
- Secure replication channels

**Data Masking**: Hide sensitive data in non-production environments
- Static masking for development/testing
- Dynamic masking for applications
- Tokenization for payment data

### Backup and Recovery
**Backup Types:**
- **Full Backup**: Complete copy of database
- **Incremental Backup**: Changes since last backup
- **Differential Backup**: Changes since last full backup
- **Transaction Log Backup**: Continuous backup of transaction log

**Recovery Strategies:**
- **Point-in-Time Recovery**: Restore to specific timestamp
- **High Availability**: Clustering, replication, failover
- **Disaster Recovery**: Geographically distributed backups

## Modern Database Trends

### Cloud Databases
**Database as a Service (DBaaS):**
- Amazon RDS, Azure SQL Database, Google Cloud SQL
- Managed maintenance, scaling, backups
- Pay-as-you-go pricing models

**Serverless Databases:**
- Automatic scaling based on demand
- Pay only for actual usage
- Examples: Aurora Serverless, CosmosDB

### NewSQL Databases
- Combine ACID properties of traditional databases with NoSQL scalability
- Examples: Google Spanner, CockroachDB, VoltDB
- Use cases requiring both consistency and scale

### Multi-Model Databases
- Support multiple data models in single system
- Examples: ArangoDB, OrientDB, Azure CosmosDB
- Reduce need for multiple database technologies

### Database DevOps
- Version control for database schemas
- Automated database deployments
- Database testing and validation
- Infrastructure as Code for database environments

### Machine Learning Integration
- In-database analytics and ML models
- Automated query optimization
- Intelligent indexing recommendations
- Anomaly detection for performance and security