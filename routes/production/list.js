const express = require("express");
const path = require("path");
const multer = require("multer");
const client = require("../src/config/postgreSql");

const router = express.Router();

// 전체 조회 SQL
const listAllSql = `
  SELECT
    p.idx,
    p.account_idx,
    p.category_idx,
    c.name        AS category_name,
    p.name,
    p.explain,
    p.weight,
    p.price,
    p.image,
    p.expiration,
    p.created_at
  FROM
    production.list p
  LEFT JOIN
    production.category c
      ON p.category_idx = c.idx
  ORDER BY
    p.idx;
`;

// 카테고리별 조회 SQL
const listByCategorySql = `
  SELECT
    p.idx,
    p.account_idx,
    p.category_idx,
    c.name        AS category_name,
    p.name,
    p.explain,
    p.weight,
    p.price,
    p.image,
    p.expiration,
    p.created_at
  FROM
    production.list p
  LEFT JOIN
    production.category c
      ON p.category_idx = c.idx
  WHERE
    p.category_idx = $1
  ORDER BY
    p.idx;
`;

/* GET /production/list
   - optional query param: category_idx
   → e.g. /production/list?category_idx=2
*/
router.get("/list", async (req, res, next) => {
  try {
    const { category_idx } = req.query;
    let result;

    if (category_idx) {
      // 카테고리 필터링
      result = await client.query(listByCategorySql, [
        parseInt(category_idx, 10),
      ]);
    } else {
      // 전체 조회
      result = await client.query(listAllSql);
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

module.exports = router;
