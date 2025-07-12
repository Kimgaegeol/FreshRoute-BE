// routes/account.js
const express = require("express");
const router = express.Router();
const client = require("../src/config/postgreSql");
const checkLoginMiddleware = require("../src/middleware/checkLogin");

/* POST /account/consumer — 소비자 회원가입 */
router.post("/consumer", async (req, res, next) => {
  const { id, pw, name, email, phone } = req.body;

  if (!id || !pw || !name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "모든 필수 필드를 입력해주세요.",
    });
  }

  try {
    const { rows } = await client.query(
      `INSERT INTO account.list (id, pw, name, email, is_farmer, phone)
       VALUES ($1, $2, $3, $4, FALSE, $5)
       RETURNING idx, created_at`,
      [id, pw, name, email, phone]
    );

    const user = rows[0];
    return res.status(201).json({
      success: true,
      user: {
        idx: user.idx,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Consumer signup error:", err);
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "이미 존재하는 계정 정보입니다.",
      });
    }
    next(err);
  }
});

/* POST /account/farmer — 농장주 회원가입 */
router.post("/farmer", async (req, res, next) => {
  const { id, pw, name, email, phone, farm_name, farm_address } = req.body;

  if (!id || !pw || !name || !email || !phone || !farm_name || !farm_address) {
    return res.status(400).json({
      success: false,
      message: "모든 필드를 입력해주세요.",
    });
  }

  try {
    await client.query("BEGIN");

    // 1) account.list 삽입
    const { rows } = await client.query(
      `INSERT INTO account.list (id, pw, name, email, is_farmer, phone)
       VALUES ($1, $2, $3, $4, TRUE, $5)
       RETURNING idx, created_at`,
      [id, pw, name, email, phone]
    );

    const account = rows[0];

    // 2) account.farmer 삽입
    await client.query(
      `INSERT INTO account.farmer (account_idx, name, address)
       VALUES ($1, $2, $3)`,
      [account.idx, farm_name, farm_address]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      account: {
        idx: account.idx,
        created_at: account.created_at,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Farmer signup error:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "이미 존재하는 계정입니다.",
      });
    }
    next(err);
  }
});

/* POST /account/signin — 로그인 처리 */
router.post("/signin", async (req, res, next) => {
  const { id, pw } = req.body;

  if (!id || !pw) {
    return res.status(400).json({
      success: false,
      message: "id와 pw를 모두 보내주세요.",
    });
  }

  try {
    const { rows } = await client.query(
      `SELECT idx, id, name, email, phone, is_farmer, created_at
       FROM account.list
       WHERE id = $1 AND pw = $2`,
      [id, pw]
    );

    if (rows.length === 1) {
      const user = rows[0];

      // 세션에 사용자 정보 저장
      req.session.user = {
        idx: user.idx,
        id: user.id,
        name: user.name,
        is_farmer: user.is_farmer,
      };

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
    } else {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      });
    }
  } catch (err) {
    console.error("Login query error:", err);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/* GET /account/info/consumer — 로그인된 소비자 정보 조회 */
router.get("/info/consumer", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(
      `SELECT idx, id, name, email, phone, is_farmer, created_at
       FROM account.list
       WHERE idx = $1`,
      [account_idx]
    );

    if (rows.length !== 1) {
      return res.status(404).json({
        success: false,
        message: "사용자 정보를 찾을 수 없습니다.",
      });
    }

    const user = rows[0];

    if (user.is_farmer) {
      return res.status(403).json({
        success: false,
        message: "권한이 없습니다.",
      });
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

/* GET /account/info/farmer — 로그인된 농장주 정보 조회 */
router.get("/info/farmer", checkLoginMiddleware, async (req, res, next) => {
  try {
    const account_idx = req.session.user.idx;

    const { rows } = await client.query(
      `SELECT 
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
       JOIN account.farmer f ON a.idx = f.account_idx
       WHERE a.idx = $1`,
      [account_idx]
    );

    if (rows.length !== 1) {
      return res.status(404).json({
        success: false,
        message: "사용자(농장주) 정보를 찾을 수 없습니다.",
      });
    }

    const info = rows[0];

    if (!info.is_farmer) {
      return res.status(403).json({
        success: false,
        message: "권한이 없습니다.",
      });
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

/* POST /account/search/id — 전화번호와 이메일로 ID 검색 */
router.post("/search/id", async (req, res, next) => {
  const { phone, email } = req.body;

  if (!phone || !email) {
    return res.status(400).json({
      success: false,
      message: "phone과 email을 모두 보내주세요.",
    });
  }

  try {
    const { rows } = await client.query(
      `SELECT id FROM account.list WHERE phone = $1 AND email = $2`,
      [phone, email]
    );

    if (rows.length === 1) {
      return res.json({ success: true, id: rows[0].id });
    } else {
      return res.status(404).json({
        success: false,
        message: "일치하는 계정이 없습니다.",
      });
    }
  } catch (err) {
    console.error("ID search error:", err);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/* POST /account/search/pw — 전화번호와 이메일로 PW 검색 */
router.post("/search/pw", async (req, res, next) => {
  const { phone, email } = req.body;

  if (!phone || !email) {
    return res.status(400).json({
      success: false,
      message: "phone과 email을 모두 보내주세요.",
    });
  }

  try {
    const { rows } = await client.query(
      `SELECT pw FROM account.list WHERE phone = $1 AND email = $2`,
      [phone, email]
    );

    if (rows.length === 1) {
      return res.json({ success: true, pw: rows[0].pw });
    } else {
      return res.status(404).json({
        success: false,
        message: "일치하는 계정이 없습니다.",
      });
    }
  } catch (err) {
    console.error("PW search error:", err);
    return res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
