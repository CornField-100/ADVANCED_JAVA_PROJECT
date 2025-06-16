const neo4j = require("neo4j-driver");

const NEO4J_URI = "bolt://localhost:7687"; 
const NEO4J_USER = "neo4j"; 
const NEO4J_PASSWORD = "Acsdoha2023"; 

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

module.exports = driver;
