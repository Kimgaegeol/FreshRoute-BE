const express = require("express");
const router = express.Router();
const client = require("../../src/config/postgreSql");
const checkLoginMiddleware = require("../../src/middleware/checkLogin");

const insertInquirySql = `INSERT INTO inquiry.question (
  order_idx,
  type_idx,
  title,
  content,
  state,
  created_at
)
VALUES ($1, $2, $3, $4, $5, now())
RETURNING idx, created_at;`;

// 📍 POST /order/inquiry
app.post("/inquiry", checkLoginMiddleware, async (req, res) => {
  const { order_idx, type_idx, title, content, state } = req.body;

  if (!order_idx || !type_idx || !title || !content || !state) {
    return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
  }

  try {
    const result = await client.query(insertInquirySql, [
      order_idx,
      type_idx,
      title,
      content,
      state,
    ]);

    const { idx, created_at } = result.rows[0];
    res.status(201).json({ inquiry_id: idx, created_at });
  } catch (err) {
    console.error("문의글 생성 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  } finally {
    client.release();
  }
});

const selectInquiriesSql = `
  SELECT 
    q.idx AS inquiry_id,
    q.title,
    q.content,
    q.state,
    q.created_at,
    o.idx AS order_id,
    o.state AS order_state,
    o.created_at AS order_created_at,
    p.idx AS product_id,
    p.name AS product_name,
    p.price AS product_price,
    p.image AS product_image,
    t.name AS inquiry_type
  FROM inquiry.question q
  JOIN orders.list o ON q.order_idx = o.idx
  JOIN production.list p ON o.production_idx = p.idx
  JOIN inquiry.type t ON q.type_idx = t.idx
  WHERE o.account_idx = $1
  ORDER BY q.created_at DESC;
`;

/* GET /order/inquiry/list
   세션 유저(account_idx) 기준으로 전체 문의글 조회
*/
router.get("/inquiry/list", checkLoginMiddleware, async (req, res, next) => {
  const account_idx = req.session.user.idx;

  try {
    const { rows } = await client.query(selectInquiriesSql, [account_idx]);

    return res.status(200).json({
      success: true,
      inquiries: rows,
    });
  } catch (err) {
    console.error("문의글 조회 실패:", err);
    return next(err);
  }
});

const selectInquirySql = `SELECT 
  q.idx AS inquiry_id,
  q.title,
  q.content,
  q.state,
  q.created_at,

  o.idx AS order_id,
  o.state AS order_state,
  o.is_finished AS order_finished,
  o.created_at AS order_created_at,

  p.idx AS product_id,
  p.name AS product_name,
  p.price AS product_price,
  p.image AS product_image,

  a.idx AS account_id,
  a.name AS account_name,
  a.email AS account_email,
  a.phone AS account_phone,

  t.name AS inquiry_type
FROM inquiry.question q
JOIN orders.list o ON q.order_idx = o.idx
JOIN production.list p ON o.production_idx = p.idx
JOIN account.list a ON o.account_idx = a.idx
JOIN inquiry.type t ON q.type_idx = t.idx
WHERE q.idx = $1;`;

router.get("inquiry/:inquiryId", checkLoginMiddleware, async (req, res) => {
  const inquiryId = req.params.inquiryId;

  try {
    const result = await client.query(selectInquirySql, [inquiryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "문의글을 찾을 수 없습니다." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("문의글 조회 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
