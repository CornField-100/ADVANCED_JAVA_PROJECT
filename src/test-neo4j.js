const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "Acsdoha2023")
);

async function testConnection() {
  const session = driver.session();

  try {
    const result = await session.run("RETURN 1 AS number");
    const record = result.records[0];
    console.log("Neo4j test query result:", record.get("number"));
  } catch (error) {
    console.error("Neo4j connection error:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

testConnection();
