const express = require("express");
const router = express.Router();
const client = require("../../src/config/postgreSql");
const checkLoginMiddleware = require("../../src/middleware/checkLogin");

/* GET /my/consumer/buy/list — 로그인된 유저의 주문(구매) 내역 조회 */
router.get("/buy/list", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(
      `SELECT
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
        production.list p ON o.production_idx = p.idx
      WHERE
        o.account_idx = $1
      ORDER BY
        o.created_at DESC`,
      [account_idx]
    );

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
    next(err);
  }
});

/* POST /my/consumer/inquiry — 새로운 문의글 작성 */
router.post("/inquiry", checkLoginMiddleware, async (req, res, next) => {
  try {
    const { order_idx, type_idx, title, content, state } = req.body;

    if (!order_idx || !type_idx || !title || !content || !state) {
      return res.status(400).json({
        success: false,
        message: "모든 필드를 입력해야 합니다.",
      });
    }

    const { rows } = await client.query(
      `INSERT INTO inquiry.question (
        order_idx,
        type_idx,
        title,
        content,
        state,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, now())
      RETURNING idx, created_at`,
      [order_idx, type_idx, title, content, state]
    );

    const inquiry = rows[0];

    return res.status(201).json({
      success: true,
      inquiry: {
        idx: inquiry.idx,
        created_at: inquiry.created_at,
      },
    });
  } catch (err) {
    console.error("문의글 생성 실패:", err);
    next(err);
  }
});

/* GET /my/consumer/inquiry/list — 세션 유저의 전체 문의글 조회 */
router.get("/inquiry/list", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(
      `SELECT 
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
      ORDER BY q.created_at DESC`,
      [account_idx]
    );

    return res.json({
      success: true,
      inquiries: rows,
    });
  } catch (err) {
    console.error("문의글 조회 실패:", err);
    next(err);
  }
});

/* GET /my/consumer/inquiry/:inquiryId — 특정 문의글 상세 조회 */
router.get(
  "/inquiry/:inquiryId",
  checkLoginMiddleware,
  async (req, res, next) => {
    try {
      const inquiryId = req.params.inquiryId;

      const { rows } = await client.query(
        `SELECT 
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
      WHERE q.idx = $1`,
        [inquiryId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "문의글을 찾을 수 없습니다.",
        });
      }

      return res.json({
        success: true,
        inquiry: rows[0],
      });
    } catch (err) {
      console.error("문의글 조회 실패:", err);
      next(err);
    }
  }
);

/* POST /my/consumer/review — 리뷰 등록 */
router.post("/review", checkLoginMiddleware, async (req, res, next) => {
  try {
    const { order_idx, likes } = req.body;

    if (!order_idx || likes === undefined) {
      return res.status(400).json({
        success: false,
        message: "order_idx와 likes를 모두 입력해주세요.",
      });
    }

    const { rows } = await client.query(
      `INSERT INTO orders.review (
        order_idx,
        likes,
        created_at
      )
      VALUES ($1, $2, now())
      RETURNING idx, created_at`,
      [order_idx, likes]
    );

    const review = rows[0];

    return res.status(201).json({
      success: true,
      review: {
        idx: review.idx,
        created_at: review.created_at,
      },
    });
  } catch (err) {
    console.error("리뷰 등록 실패:", err);
    next(err);
  }
});

/* GET /my/consumer/review — 현재 로그인한 유저의 전체 리뷰 조회 */
router.get("/review", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(
      `SELECT
        r.idx            AS review_id,
        r.order_idx,
        r.likes,
        r.created_at     AS review_created_at,
        o.idx            AS order_id,
        o.created_at     AS order_created_at,
        o.state          AS order_state,
        p.idx            AS product_id,
        p.name           AS product_name,
        p.image          AS product_image,
        p.price          AS product_price
      FROM orders.review r
      JOIN orders.list o ON r.order_idx = o.idx
      JOIN production.list p ON o.production_idx = p.idx
      WHERE o.account_idx = $1
      ORDER BY r.created_at DESC`,
      [account_idx]
    );

    return res.json({
      success: true,
      reviews: rows,
    });
  } catch (err) {
    console.error("리뷰 조회 실패:", err);
    next(err);
  }
});

module.exports = router;
