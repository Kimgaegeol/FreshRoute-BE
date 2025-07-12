// routes/pay.js
const express = require("express");
const router = express.Router();
const client = require("../src/config/postgreSql");
const checkLoginMiddleware = require("../src/middleware/checkLogin");

/* POST /pay — 주문 생성 (결제 처리) */
router.post("/", checkLoginMiddleware, async (req, res, next) => {
  const account_idx = req.session.user.idx;
  let { production_idx } = req.body;

  if (!production_idx) {
    return res.status(400).json({
      success: false,
      message: "production_idx를 보내주세요.",
    });
  }

  // 단일 값도 배열로 처리
  if (!Array.isArray(production_idx)) {
    production_idx = [production_idx];
  }

  try {
    await client.query("BEGIN");

    const inserted = [];
    for (const prodId of production_idx) {
      const { rows } = await client.query(
        `INSERT INTO orders.list (account_idx, production_idx, state, is_finished)
         VALUES ($1, $2, $3, FALSE)
         RETURNING idx, production_idx, state, created_at`,
        [account_idx, prodId, "배송 준비 중"]
      );
      inserted.push(rows[0]);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      orders: inserted,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order insert error:", err);
    return next(err);
  }
});

module.exports = router;
