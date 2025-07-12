var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

var session = require("express-session");

var app = express();

// 세션 미들웨어 설정
app.use(
  session({
    secret: "your-secret-key", // 반드시 랜덤하고 복잡한 값으로 설정
    resave: false, // 요청마다 세션을 다시 저장하지 않음
    saveUninitialized: false, // 초기화되지 않은 세션은 저장하지 않음
    cookie: {
      maxAge: 1000 * 60 * 60, // 쿠키 유효시간 (밀리초) → 1시간
      httpOnly: false, // 클라이언트에서 JS로 쿠키 접근 못하게 함 (보안)
      secure: false, // HTTPS 환경이면 true (로컬 개발은 false)
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

var indexRouter = require("./routes/index");
app.use("/", indexRouter);

const signupRouter = require("./routes/account/signup");
const signinRouter = require("./routes/account/siginin");
const signsearchRouter = require("./routes/account/search");
const accountInfoRouter = require("./routes/account/info");
app.use("/", signupRouter);
app.use("/", signinRouter);
app.use("/", signsearchRouter);
app.use("/", accountInfoRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
