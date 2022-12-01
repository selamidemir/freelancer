const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const fileUpload = require("express-fileupload");
const randomstring = require("randomstring");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const Portfolio = require("./models/Portfolio");

const app = express();
const port = process.env.port || 5000;

// Ortam değişkenlerini ayarla
dotenv.config();
mongoose
  .connect(process.env.APP_MONGODB_FULL_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.APP_MONGODB_DB_NAME,
  })
  .catch((err) => console.log("HATA: MongoBD bağlantısı yapılamadı: ", err));
global.userIN = true;

// Set view engine
app.set("view engine", "ejs");

// middlewares
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
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
  if (req.session.userID) userIN = req.session.userID;
  next();
});

app.get("/login", async (req, res) => {
  const user = await User.findOne({});
  const login = user ? true : false;
  res.status(200).render("login", {
    pageName: "login",
    login: login,
    errors: null,
  });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({});
  if (user) {
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (result) {
        req.session.userID = user._id;
        res.status(200).redirect("/");
      } else {
        res.status(400).render("login", {
          pageName: "login",
          login: true,
          errors: "Something goes wrong!",
        });
      }
    });
  } else {
    res.status(400).redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.session.userID = null;
  global.userIN = false;
  res.status(200).redirect("/");
});

app.post("/register", async (req, res) => {
  const user = await User.findOne({});
  if (user) res.status(400).redirect("/");
  else {
    const userInfo = {
      email: req.body.email,
      password: req.body.password,
    };
    const newUser = await User.create(userInfo);
    res.status(201).redirect("/login");
  }
});

app.post("/portfolies", async (req, res) => {
  const errors = validationResult(req);
  const file = req.files.photo;
  const uploadDir = `${__dirname}/public/uploads`;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdir(`${__dirname}/public/uploads`, (err) => {
      if (err) res.status(500).redirect("/");
      return;
    });
  }

  if (errors.isEmpty()) {
    const path = `${__dirname}/public/uploads/${file.name}`;
    file.mv(path, async (err) => {
      if (err) res.status(500).redirect("/");
      else {
        const photoFile = `${randomstring.generate()}.${
          req.files.photo.name.split(".")[1]
        }`;

        const portfolioInfo = {
          title: req.body.title,
          description: req.body.description,
          photo: photoFile,
        };
        await Portfolio.create(portfolioInfo);
        res.status(201).redirect("/");
      }
    });
  } else {
    const portfolies = await Portfolio.find({});
    res.status(400).render("index", {
      pageName: "home",
      portfolies,
      errors: errors,
    });
  }
});

app.get("/portfolies/delete/:id", async (req, res) => {
  const id = req.params.id;
  const portfolio = await Portfolio.findById(id);

  if (!portfolio) {
    res.status(400).redirect("/");
    return;
  }

  const photo = `${__dirname}/public/uploads/${portfolio.photo}`;

  fs.unlink(photo, async (err) => {
    if (!err) {
      await Portfolio.findByIdAndRemove(id);
      res.status(200).redirect("/");
    } else {
      const portfolies = await Portfolio.find({});
      res.status(500).render("index", {
        pageName: "home",
        portfolies,
        errors: "Somethings goes wrong!",
      });
    }
  });
});

app.get("/", async (req, res) => {
  const portfolies = await Portfolio.find({});
  res.status(200).render("index", {
    pageName: "home",
    portfolies,
    errors: null,
  });
});

app.listen(port, (err) => {
  if (err) {
    console.log("Bir hata oluştu.");
    console.log(err);
  } else console.log(`Sunucu ${port} nolu port üzerinden çalışmaya başladı.`);
});
