const driver = require("../config/neo4j.js");

const createOrder = async (req, res) => {
  const { userId, items } = req.body;

  const session = driver.session();

  try {
    const orderId = `order-${Date.now()}`;

    await session.run(
      `CREATE (o:Order {id: $orderId, userId: $userId, createdAt: datetime()})`,
      { orderId, userId }
    );

    for (const item of items) {
      await session.run(
        `
        MATCH (o:Order {id: $orderId})
        MERGE (p:Product {id: $productId})
        MERGE (o)-[:CONTAINS {quantity: $quantity}]->(p)
        `,
        {
          orderId,
          productId: item.id,
          quantity: item.quantity,
        }
      );
    }

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    console.error("Neo4j order error:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await session.close();
  }
};

module.exports = { createOrder };
