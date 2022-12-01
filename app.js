const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();
const port = process.env.port || 5000;

// Ortam değişkenlerini ayarla
dotenv.config();
global.userIN = true;

// Set view engine
app.set("view engine", "ejs");

// middlewares
app.use(express.static("public"));
app.use(
  // session aç
  session({
    secret: process.env.APP_SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.APP_MONGODB_FULL_URL,
      dbName: process.env.APP_MONGODB_DB_NAME,
    }),
  })
);
app.use("*", (req, res, next) => {
    if(req.session.userID) userIN = req.session.userID;
    next();
})

app.get("/", async (req, res) => {
  res.status(200).render("index", {
    pageName: "home",
    portfolios: null,
    error: null,
  });
});

app.listen(port, (err) => {
  if (err) {
    console.log("Bir hata oluştu.");
    console.log(err);
  } else console.log(`Sunucu ${port} nolu port üzerinden çalışmaya başladı.`);
});
