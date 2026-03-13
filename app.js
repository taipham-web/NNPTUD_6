var createError = require("http-errors");
require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let { testConnection, initSchema } = require("./config/mysql");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//domain:port/api/v1/products
//domain:port/api/v1/users
//domain:port/api/v1/categories
//domain:port/api/v1/roles

initSchema()
  .then(() => testConnection())
  .then(() => {
    console.log("MySQL connected");
  })
  .catch((error) => {
    console.error("MySQL connect error:", error.message);
  });

app.use("/", require("./routes/index"));
app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/roles", function (req, res) {
  res.status(501).send({ message: "roles API chua duoc migrate sang MySQL" });
});
app.use("/api/v1/products", function (req, res) {
  res
    .status(501)
    .send({ message: "products API chua duoc migrate sang MySQL" });
});
app.use("/api/v1/categories", function (req, res) {
  res
    .status(501)
    .send({ message: "categories API chua duoc migrate sang MySQL" });
});
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

module.exports = app;
