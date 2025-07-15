var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
const cors = require("cors");

const session = require("express-session");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      return callback(null, true);
    },
    credentials: true, // 쿠키 허용
  })
);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
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
app.use("/backend", indexRouter);

const accountRouter = require("./routes/account");
const productionRouter = require("./routes/production");
const bucketRouter = require("./routes/bucket");
const payRouter = require("./routes/pay");
const saleRouter = require("./routes/sale");
const mypageConsumerRouter = require("./routes/mypage/consumer");
const mypageFarmerRouter = require("./routes/mypage/farmer");
const fertilizerRouter = require("./routes/fertilizer");

app.use("/backend/account", accountRouter);
app.use("/backend/production", productionRouter);
app.use("/backend/bucket", bucketRouter);
app.use("/backend/pay", payRouter);
app.use("/backend/sale", saleRouter);
app.use("/backend/my/consumer", mypageConsumerRouter);
app.use("/backend/my/farmer", mypageFarmerRouter);
app.use("/backend/api", fertilizerRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  // 0.0.0.0 으로 바인딩해야 LAN IP로도 접근 가능
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
