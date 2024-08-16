require("dotenv").config();
const express = require("express");
const mainRouter = require("./server/routes/main");
const adminRouter = require("./server/routes/admin");
const session = require("express-session");
const { isActiveRoute } = require("./server/helpers/routeHelpers");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser"); //used to store our
//session when we log in so that we need not to login everytime.
const MongoStore = require("connect-mongo");

const connectDb = require("./server/config/db");
const app = express();
const PORT = process.env.PORT || 3000;
const expressLayout = require("express-ejs-layouts");

connectDb();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);
//Templating Engine
app.use(expressLayout);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");

app.locals.isActiveRoute = isActiveRoute;
app.use("/", mainRouter);
app.use("/", adminRouter);
app.listen(PORT, () => {
  console.log(`App listening on PORT: ${PORT}`);
});
