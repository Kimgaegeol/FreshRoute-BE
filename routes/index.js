var express = require("express");
var router = express.Router();

const client = require("../src/config/postgreSql");

/* GET /home — return 10 random products as JSON */
router.get("/home", async function (req, res, next) {
  try {
    const sql = `
      SELECT idx, name, price, image, weight, expiration
      FROM production.list
      ORDER BY RANDOM()
      LIMIT 10;
    `;
    const { rows: products } = await client.query(sql);
    console.log(products);
    res.json({ products });
  } catch (err) {
    console.error("DB query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
