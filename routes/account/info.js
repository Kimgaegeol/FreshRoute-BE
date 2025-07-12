// routes/account.js
const express = require("express");
const router = express.Router();
const client = require("../../src/config/postgreSql");
const checkLoginMiddleware = require("../../src/middleware/checkLogin"); // 세션 확인용 미들웨어

// consumer 정보 조회 SQL
const consumerInfoSql = `
  SELECT idx, id, name, email, phone, is_farmer, created_at
  FROM account.list
  WHERE idx = $1;
`;

/* GET /account/info/consumer — 로그인된 consumer 정보 조회 */
router.get("/info/consumer", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(consumerInfoSql, [account_idx]);
    if (rows.length !== 1) {
      return res
        .status(404)
        .json({ success: false, message: "사용자 정보를 찾을 수 없습니다." });
    }

    const user = rows[0];
    // 필요하다면 is_farmer 체크: consumer 전용 API라면!
    if (user.is_farmer) {
      return res
        .status(403)
        .json({ success: false, message: "권한이 없습니다." });
    }

    return res.json({
      success: true,
      user: {
        idx: user.idx,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_farmer: user.is_farmer,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Consumer info error:", err);
    next(err);
  }
});

// farmer 정보 조회 SQL
const farmerInfoSql = `
  SELECT 
    a.idx          AS account_idx,
    a.id,
    a.name         AS user_name,
    a.email,
    a.phone,
    a.is_farmer,
    a.created_at,
    f.idx          AS farmer_idx,
    f.name         AS farm_name,
    f.address      AS farm_address
  FROM account.list a
  JOIN account.farmer f
    ON a.idx = f.account_idx
  WHERE a.idx = $1;
`;

/* GET /account/info/farmer — 로그인된 farmer 정보 조회 */
router.get("/info/farmer", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(farmerInfoSql, [account_idx]);
    if (rows.length !== 1) {
      return res.status(404).json({
        success: false,
        message: "사용자(농장주) 정보를 찾을 수 없습니다.",
      });
    }

    const info = rows[0];
    // consumer 전용 API가 아니니 is_farmer 체크는 생략하거나, 필요시 아래처럼 처리
    if (!info.is_farmer) {
      return res
        .status(403)
        .json({ success: false, message: "권한이 없습니다." });
    }

    return res.json({
      success: true,
      farmer: {
        account_idx: info.account_idx,
        id: info.id,
        user_name: info.user_name,
        email: info.email,
        phone: info.phone,
        created_at: info.created_at,
        farmer_idx: info.farmer_idx,
        farm_name: info.farm_name,
        farm_address: info.farm_address,
      },
    });
  } catch (err) {
    console.error("Farmer info error:", err);
    next(err);
  }
});

module.exports = router;
