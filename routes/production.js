// routes/production.js
const express = require("express");
const client = require("../src/config/postgreSql");
const router = express.Router();

/* GET /production/category — 전체 카테고리 목록 반환 */
router.get("/category", async (req, res, next) => {
  try {
    const { rows } = await client.query(
      `SELECT idx AS category_idx, name AS category_name
       FROM production.category
       ORDER BY name`
    );

    return res.json({ success: true, categories: rows });
  } catch (err) {
    console.error("Category list error:", err);
    return res.status(500).json({
      success: false,
      message: "카테고리 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

/* GET /production/list — 상품 목록 조회 (카테고리 필터링 옵션) */
router.get("/list", async (req, res, next) => {
  try {
    const { category_idx } = req.query;
    let result;

    if (category_idx) {
      // 카테고리별 조회
      result = await client.query(
        `SELECT p.idx, p.account_idx, p.category_idx, c.name AS category_name,
                p.name, p.explain, p.weight, p.price, p.image, p.expiration, p.created_at
         FROM production.list p
         LEFT JOIN production.category c ON p.category_idx = c.idx
         WHERE p.category_idx = $1
         ORDER BY p.idx`,
        [parseInt(category_idx, 10)]
      );
    } else {
      // 전체 조회
      result = await client.query(
        `SELECT p.idx, p.account_idx, p.category_idx, c.name AS category_name,
                p.name, p.explain, p.weight, p.price, p.image, p.expiration, p.created_at
         FROM production.list p
         LEFT JOIN production.category c ON p.category_idx = c.idx
         ORDER BY p.idx`
      );
    }

    return res.json({
      success: true,
      products: result.rows,
    });
  } catch (err) {
    console.error("Production list error:", err);
    return res.status(500).json({
      success: false,
      message: "상품 목록 조회 중 오류가 발생했습니다.",
    });
  }
});

/* GET /production/:id — 특정 상품 상세 조회 */
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows } = await client.query(
      `SELECT p.idx, p.account_idx, p.category_idx, c.name AS category_name,
              p.name, p.explain, p.weight, p.price, p.image, p.expiration, p.created_at
       FROM production.list p
       LEFT JOIN production.category c ON p.category_idx = c.idx
       WHERE p.idx = $1`,
      [parseInt(id, 10)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 상품을 찾을 수 없습니다.",
      });
    }

    return res.json({
      success: true,
      product: rows[0],
    });
  } catch (err) {
    console.error("Product detail error:", err);
    return res.status(500).json({
      success: false,
      message: "상품 상세 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
