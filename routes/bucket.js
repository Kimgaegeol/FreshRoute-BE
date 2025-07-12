// routes/bucket.js
const express = require("express");
const router = express.Router();
const client = require("../src/config/postgreSql");
const checkLoginMiddleware = require("../src/middleware/checkLogin");

/* POST /bucket — 로그인된 유저의 장바구니에 상품 추가 */
router.post("/", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;
    const { production_idx } = req.body;

    if (!production_idx) {
      return res.status(400).json({
        success: false,
        message: "production_idx를 보내주세요.",
      });
    }

    const { rows } = await client.query(
      `INSERT INTO account.bucket (account_idx, production_idx, created_at)
       VALUES ($1, $2, now())
       RETURNING idx, created_at`,
      [account_idx, parseInt(production_idx, 10)]
    );

    const bucket = rows[0];

    return res.status(201).json({
      success: true,
      bucket: {
        idx: bucket.idx,
        created_at: bucket.created_at,
      },
    });
  } catch (err) {
    console.error("Insert bucket error:", err);
    next(err);
  }
});

/* DELETE /bucket/:bucket_idx — 로그인된 유저의 장바구니 항목 삭제 */
router.delete("/:bucket_idx", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;
    const bucket_idx = parseInt(req.params.bucket_idx, 10);

    if (isNaN(bucket_idx)) {
      return res.status(400).json({
        success: false,
        message: "올바른 bucket_idx를 전달해주세요.",
      });
    }

    const { rows } = await client.query(
      `DELETE FROM account.bucket
       WHERE idx = $1 AND account_idx = $2
       RETURNING idx`,
      [bucket_idx, account_idx]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "삭제할 항목을 찾을 수 없거나 권한이 없습니다.",
      });
    }

    return res.json({
      success: true,
      deleted_bucket_idx: rows[0].idx,
    });
  } catch (err) {
    console.error("Delete bucket error:", err);
    next(err);
  }
});

/* GET /bucket/list — 로그인된 유저의 장바구니 항목 조회 */
router.get("/list", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(
      `SELECT b.idx AS bucket_idx, b.account_idx, b.production_idx,
              p.name AS product_name, p.explain AS product_description,
              p.price, p.image AS product_image, p.weight, p.expiration,
              b.created_at AS added_at
       FROM account.bucket b
       LEFT JOIN production.list p ON b.production_idx = p.idx
       WHERE b.account_idx = $1
       ORDER BY b.created_at DESC`,
      [account_idx]
    );

    return res.json({
      success: true,
      buckets: rows,
    });
  } catch (err) {
    console.error("Bucket list error:", err);
    return res.status(500).json({
      success: false,
      message: "버킷 목록 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
