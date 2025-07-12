var express = require("express");
var router = express.Router();
const client = require("../../src/config/postgreSql");

const signinSql = `
  SELECT idx, id, name, email, phone, is_farmer, created_at
  FROM account.list
  WHERE id = $1 AND pw = $2;
`;

/* POST /account/signin — 로그인 처리 */
router.post("/signin", async function (req, res, next) {
  const { id, pw } = req.body;
  if (!id || !pw) {
    return res
      .status(400)
      .json({ success: false, message: "id와 pw를 모두 보내주세요." });
  }

  try {
    const { rows } = await client.query(signinSql, [id, pw]);
    if (rows.length === 1) {
      const user = rows[0];
      // 세션에 사용자 정보 저장 (원하는 필드만)
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
    return res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
