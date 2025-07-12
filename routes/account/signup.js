var express = require("express");
var router = express.Router();
const client = require("../../src/config/postgreSql");

// consumer 회원가입 SQL
const insertConsumerSql = `
  INSERT INTO account.list (id, pw, name, email, is_farmer, phone)
  VALUES ($1, $2, $3, $4, FALSE, $5)
  RETURNING idx, created_at;
`;

router.post("/consumer", async (req, res, next) => {
  const { id, pw, name, email, phone } = req.body;

  // 필수 입력 체크
  if (!id || !pw || !name || !email || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "모든 필수 필드를 입력해주세요." });
  }

  try {
    const { rows } = await client.query(insertConsumerSql, [
      id,
      pw,
      name,
      email,
      phone,
    ]);
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
    // 중복 키 에러 처리 (예: id나 phone 중복)
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "이미 존재하는 계정 정보입니다." });
    }
    next(err);
  }
});

// 1) account.list에 삽입
const insertFarmerSql = `
  INSERT INTO account.list (id, pw, name, email, is_farmer, phone)
  VALUES ($1, $2, $3, $4, TRUE, $5)
  RETURNING idx, created_at;
`;

// 2) account.farmer에 삽입
const insertFarmSql = `
  INSERT INTO account.farmer (account_idx, name, address)
  VALUES ($1, $2, $3);
`;

router.post("/farmer", async (req, res, next) => {
  const { id, pw, name, email, phone, farm_name, farm_address } = req.body;

  // 필수 필드 체크
  if (!id || !pw || !name || !email || !phone || !farm_name || !farm_address) {
    return res
      .status(400)
      .json({ success: false, message: "모든 필드를 입력해주세요." });
  }

  try {
    // 트랜잭션 시작
    await client.query("BEGIN");

    // 1) account.list 삽입
    const {
      rows: [account],
    } = await client.query(insertFarmerSql, [id, pw, name, email, phone]);

    // 2) account.farmer 삽입 (farm_name, farm_address)
    await client.query(insertFarmSql, [account.idx, farm_name, farm_address]);

    // 커밋
    await client.query("COMMIT");

    // 성공 응답
    return res.status(201).json({
      success: true,
      account: {
        idx: account.idx,
        created_at: account.created_at,
      },
    });
  } catch (err) {
    // 실패 시 롤백
    await client.query("ROLLBACK");

    console.error("Farmer signup error:", err);
    // 중복 에러 처리
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "이미 존재하는 계정입니다." });
    }
    next(err);
  }
});

module.exports = router;
