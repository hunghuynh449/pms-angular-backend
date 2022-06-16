var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");

// var indexRouter = require('./routes/index');
var usersRouter = require("./routes/users");

var app = express();
const fs = require("fs");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
var cors = require("cors");
const fetch = require("node-fetch");
const PRIVATE_KEY = fs.readFileSync("private-key.txt");
app.use(bodyParser.json());
app.use(cors());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "abcdefg",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

app.get("/", (req, res) => {
  res.send("<h1>Đây là trang home</h1>");
});

app.post("/login", async (req, res) => {
  const un = req.body.un;
  const pw = req.body.pw;
  let check = await checkUserPass(un, pw);
  if (check) {
    const userInfo = await getUserInfo(un);
    console.log(userInfo);
    if (userInfo) {
      const jwtBearerToken = jwt.sign({}, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: 120,
        subject: userInfo.id,
      });
      //res.cookie("SESSIONID", jwtBearerToken, {httpOnly:true, secure:false});
      res
        .status(200)
        .json({ idToken: jwtBearerToken, userId: userInfo.id, expiresIn: 120 });
    }
  } else res.sendStatus(401); // send status 401 Unauthorized
});

checkUserPass = async (un, pw) => {
  const response = await fetch("http://localhost:5000/taiKhoan");
  const data = await response.json();
  let check;
  data.forEach((item) => {
    if (un == item.userName && pw == item.password) {
      check = true;
    }
  });
  if (check) {
    return true;
  } else {
    return false;
  }
  //   return false;
};

getUserInfo = async (username) => {
  const response = await fetch("http://localhost:5000/taiKhoan");
  const data = await response.json();
  let temp = false;
  data.forEach((item) => {
    if (username == item.userName) {
      // console.log(true);
      temp = item;
    }
  });
  if (temp) {
    return temp;
  } else {
    return 0;
  }
};

// app.use('/', indexRouter);
app.use("/users", usersRouter);

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
