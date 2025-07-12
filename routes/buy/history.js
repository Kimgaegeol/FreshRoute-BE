const express = require("express");
const router = express.Router();
const client = require("../../src/config/postgreSql");
const checkLoginMiddleware = require("../../src/middleware/checkLogin");

// 주문(구매) 내역 조회 SQL
const listOrderHistorySql = `
  SELECT
    o.idx            AS order_idx,
    o.account_idx,
    o.production_idx,
    p.name           AS product_name,
    p.explain        AS product_description,
    p.price,
    p.image          AS product_image,
    o.state,
    o.is_finished,
    o.created_at     AS order_date
  FROM
    orders.list o
  LEFT JOIN
    production.list p
      ON o.production_idx = p.idx
  WHERE
    o.account_idx = $1
  ORDER BY
    o.created_at DESC;
`;

/* GET /buy/history — 로그인된 유저의 주문(구매) 내역 조회 */
router.get("/history", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(listOrderHistorySql, [account_idx]);

    return res.json({
      success: true,
      orders: rows.map((o) => ({
        order_idx: o.order_idx,
        production_idx: o.production_idx,
        product_name: o.product_name,
        product_description: o.product_description,
        price: o.price,
        image: o.product_image,
        state: o.state,
        is_finished: o.is_finished,
        order_date: o.order_date,
      })),
    });
  } catch (err) {
    console.error("Order history error:", err);
    return res.status(500).json({
      success: false,
      message: "주문 내역 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
