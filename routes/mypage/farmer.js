const express = require("express");
const router = express.Router();
const client = require("../../src/config/postgreSql");
const checkLoginMiddleware = require("../../src/middleware/checkLogin");

/* GET /my/farmer/sale/list — 로그인된 유저의 판매 내역 조회 */
router.get("/sale/list", checkLoginMiddleware, async (req, res, next) => {
  const account_idx = req.session.user.idx;

  const query = `
    SELECT
      p.idx AS product_id,
      p.account_idx,
      p.category_idx,
      c.name AS category_name,
      p.name AS product_name,
      p.explain AS product_description,
      p.weight,
      p.price,
      p.image,
      p.expiration,
      p.created_at
    FROM production.list p
    LEFT JOIN production.category c ON p.category_idx = c.idx
    WHERE p.account_idx = $1
    ORDER BY p.created_at DESC;
  `;

  try {
    const { rows } = await client.query(query, [account_idx]);
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("판매자 상품 조회 오류:", err);
    next(err);
  }
});

/* GET /my/farmer/sale/:id — 특정 상품 상세 조회 */
router.get("/sale/:id", checkLoginMiddleware, async (req, res, next) => {
  const productId = req.params.id;

  const query = `
    SELECT
      p.idx AS product_id,
      p.account_idx,
      p.category_idx,
      c.name AS category_name,
      p.name AS product_name,
      p.explain AS product_description,
      p.weight,
      p.price,
      p.image,
      p.expiration,
      p.created_at
    FROM production.list p
    LEFT JOIN production.category c ON p.category_idx = c.idx
    WHERE p.idx = $1;
  `;

  try {
    const { rows } = await client.query(query, [productId]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    console.error("상품 상세 조회 오류:", err);
    next(err);
  }
});

/* PUT /my/farmer/sale/:id — 상품 수정 */
router.put("/sale/:id", checkLoginMiddleware, async (req, res, next) => {
  const productId = req.params.id;
  const { category_idx, name, explain, weight, price, image, expiration } =
    req.body;

  const query = `
    UPDATE production.list
    SET category_idx = $1,
        name = $2,
        explain = $3,
        weight = $4,
        price = $5,
        image = $6,
        expiration = $7
    WHERE idx = $8
    RETURNING idx;
  `;

  try {
    const { rows } = await client.query(query, [
      category_idx,
      name,
      explain,
      weight,
      price,
      image,
      expiration,
      productId,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    res.json({ success: true, product_id: rows[0].idx });
  } catch (err) {
    console.error("상품 수정 오류:", err);
    next(err);
  }
});

/* DELETE /my/farmer/sale/:id — 상품 삭제 */
router.delete("/sale/:id", checkLoginMiddleware, async (req, res, next) => {
  const productId = req.params.id;

  const query = `
    DELETE FROM production.list
    WHERE idx = $1
    RETURNING idx;
  `;

  try {
    const { rows } = await client.query(query, [productId]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "상품을 찾을 수 없습니다." });
    }
    res.json({ success: true, deleted_product_id: rows[0].idx });
  } catch (err) {
    console.error("상품 삭제 오류:", err);
    next(err);
  }
});

/* GET /my/farmer/order/list — 내 상품에 대한 주문 내역 조회 */
router.get("/order/list", checkLoginMiddleware, async (req, res, next) => {
  const account_idx = req.session.user.idx;

  const query = `
    SELECT
      o.idx               AS order_id,
      o.account_idx       AS buyer_account_idx,
      o.production_idx,
      p.name              AS product_name,
      p.price,
      o.state             AS order_state,
      o.is_finished,
      o.created_at        AS order_date
    FROM orders.list o
    JOIN production.list p ON o.production_idx = p.idx
    WHERE p.account_idx = $1
    ORDER BY o.created_at DESC;
  `;

  try {
    const { rows } = await client.query(query, [account_idx]);

    return res.json({
      success: true,
      orders: rows.map((order) => ({
        order_id: order.order_id,
        buyer_account_idx: order.buyer_account_idx,
        production_idx: order.production_idx,
        product_name: order.product_name,
        price: order.price,
        order_state: order.order_state,
        is_finished: order.is_finished,
        order_date: order.order_date,
      })),
    });
  } catch (err) {
    console.error("판매자 주문 내역 조회 오류:", err);
    return next(err);
  }
});

/* GET /my/farmer/order/:orderId — 주문 상세 조회 */
router.get("/order/:orderId", checkLoginMiddleware, async (req, res, next) => {
  const orderId = req.params.orderId;

  const query = `
    SELECT
      o.idx               AS order_id,
      o.account_idx       AS buyer_account_idx,
      o.production_idx,
      p.name              AS product_name,
      p.price,
      o.state             AS order_state,
      o.is_finished,
      o.created_at        AS order_date
    FROM orders.list o
    JOIN production.list p ON o.production_idx = p.idx
    WHERE o.idx = $1;
  `;

  try {
    const { rows } = await client.query(query, [orderId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "주문 정보를 찾을 수 없습니다." });
    }

    return res.json({
      success: true,
      order: rows[0],
    });
  } catch (err) {
    console.error("주문 상세 조회 오류:", err);
    return next(err);
  }
});

// GET /my/farmer/inquiry/list — 내 상품에 대한 전체 문의 조회
router.get("/inquiry/list", checkLoginMiddleware, async (req, res, next) => {
  const account_idx = req.session.user.idx;

  const query = `
    SELECT
      q.idx                AS inquiry_id,
      q.title,
      q.content,
      q.state              AS inquiry_state,
      q.created_at         AS inquiry_created_at,
      o.idx                AS order_id,
      p.idx                AS product_id,
      p.name               AS product_name,
      a.idx                AS customer_id,
      a.name               AS customer_name,
      t.name               AS inquiry_type
    FROM inquiry.question q
    JOIN orders.list o ON q.order_idx = o.idx
    JOIN production.list p ON o.production_idx = p.idx
    JOIN account.list a ON o.account_idx = a.idx
    JOIN inquiry.type t ON q.type_idx = t.idx
    WHERE p.account_idx = $1
    ORDER BY q.created_at DESC;
  `;

  try {
    const { rows } = await client.query(query, [account_idx]);
    res.json({ success: true, inquiries: rows });
  } catch (err) {
    console.error("판매자 문의 목록 조회 오류:", err);
    next(err);
  }
});

// GET /my/farmer/inquiry/:inquiryId — 내 상품에 대한 전체 문의 조회
router.get(
  "/inquiry/:inquiryId",
  checkLoginMiddleware,
  async (req, res, next) => {
    const inquiryId = req.params.inquiryId;

    const query = `
    SELECT 
      q.idx              AS inquiry_id,
      q.title,
      q.content,
      q.state,
      q.created_at,
      
      o.idx              AS order_id,
      o.state            AS order_state,
      o.is_finished      AS order_finished,
      o.created_at       AS order_created_at,

      p.idx              AS product_id,
      p.name             AS product_name,
      p.price            AS product_price,
      p.image            AS product_image,

      a.idx              AS account_id,
      a.name             AS account_name,
      a.email            AS account_email,
      a.phone            AS account_phone,

      t.name             AS inquiry_type
    FROM inquiry.question q
    JOIN orders.list o ON q.order_idx = o.idx
    JOIN production.list p ON o.production_idx = p.idx
    JOIN account.list a ON o.account_idx = a.idx
    JOIN inquiry.type t ON q.type_idx = t.idx
    WHERE q.idx = $1;
  `;

    try {
      const { rows } = await client.query(query, [inquiryId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "문의글을 찾을 수 없습니다.",
        });
      }

      return res.status(200).json({
        success: true,
        inquiry: rows[0],
      });
    } catch (err) {
      console.error("문의글 상세 조회 실패:", err);
      next(err);
    }
  }
);

// 📍 GET /my/review/:orderId — 특정 주문에 대한 리뷰 상세 조회
router.get("/review/:orderId", checkLoginMiddleware, async (req, res, next) => {
  const orderId = req.params.orderId;

  const query = `
    SELECT
      r.idx            AS review_id,
      r.order_idx,
      r.likes,
      r.created_at     AS review_created_at,
      o.account_idx    AS buyer_account_id,
      o.production_idx,
      p.name           AS product_name,
      p.price          AS product_price,
      p.image          AS product_image
    FROM orders.review r
    JOIN orders.list o ON r.order_idx = o.idx
    JOIN production.list p ON o.production_idx = p.idx
    WHERE r.order_idx = $1;
  `;

  try {
    const { rows } = await client.query(query, [orderId]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 주문에 대한 리뷰를 찾을 수 없습니다.",
      });
    }

    res.json({ success: true, review: rows[0] });
  } catch (err) {
    console.error("리뷰 상세 조회 오류:", err);
    next(err);
  }
});

module.exports = router;
