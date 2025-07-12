// routes/account.js
const express = require("express");
const router = express.Router();
const client = require("../../src/config/postgreSql");

// ID 찾기 SQL
const idSearchSql = `
  SELECT id
  FROM account.list
  WHERE phone = $1 AND email = $2;
`;

// PW 찾기 SQL
const pwSearchSql = `
  SELECT pw
  FROM account.list
  WHERE phone = $1 AND email = $2;
`;

/* POST /account/search/id — 전화번호와 이메일로 ID 검색 */
router.post("/search/id", async (req, res, next) => {
  const { phone, email } = req.body;
  if (!phone || !email) {
    return res
      .status(400)
      .json({ success: false, message: "phone과 email을 모두 보내주세요." });
  }

  try {
    const { rows } = await client.query(idSearchSql, [phone, email]);
    if (rows.length === 1) {
      return res.json({ success: true, id: rows[0].id });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "일치하는 계정이 없습니다." });
    }
  } catch (err) {
    console.error("ID search error:", err);
    return res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

/* POST /account/search/pw — 전화번호와 이메일로 PW 검색 */
router.post("/search/pw", async (req, res, next) => {
  const { phone, email } = req.body;
  if (!phone || !email) {
    return res
      .status(400)
      .json({ success: false, message: "phone과 email을 모두 보내주세요." });
  }

  try {
    const { rows } = await client.query(pwSearchSql, [phone, email]);
    if (rows.length === 1) {
      return res.json({ success: true, pw: rows[0].pw });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "일치하는 계정이 없습니다." });
    }
  } catch (err) {
    console.error("PW search error:", err);
    return res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
