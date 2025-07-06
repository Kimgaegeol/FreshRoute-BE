function checkLogin(req, res, next) {
  if (req.session && req.session.user) {
    // 로그인 상태
    return next();
  } else {
    // 로그인 안된 상태
    return res.status(401).send({ error: "로그인이 필요합니다." });
  }
}

module.exports = checkLogin;
