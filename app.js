var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

var session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var productionRouter = require("./routes/production");
var ordersRouter = require("./routes/orders");

var app = express();

app.use(
  session({
    secret: "test_secret_key", // 테스트용 간단 secret (배포 시 반드시 변경)
    resave: true, // 테스트에선 true로 해도 무방 (매 요청마다 세션 저장)
    saveUninitialized: true, // 초기 세션도 저장
    cookie: {
      maxAge: 1000 * 60 * 30, // 30분 (필요에 따라 조절)
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/production", productionRouter);
app.use("/orders", ordersRouter);

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
