const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt"); //used to encrypt and decrypt password
const jwt = require("jsonwebtoken");

const router = express.Router();

const adminLayout = "../views/layouts/admin.ejs";

//check login

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// GET /
// Login page
router.get("/admin", (req, res) => {
  try {
    const locals = {
      title: "admin",
      description: "admin page",
    };

    res.render("admin/index", { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

// POST /
// Admin - check login.

router.post("/admin", async (req, res) => {
  try {
    const locals = {
      title: "admin",
    };
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

// POST /
// Admin - Register

router.post("/register", async (req, res) => {
  try {
    const locals = {
      title: "admin",
    };
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password: hashedPassword });
      //the properties above in the obj. should be the same as in User model.
      res.status(201).json({ message: "User created", user });
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json({ message: "User already in use." });
      } else {
        res.status(500).json({ message: "Internal server error." });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// get /
// Admin dashboard

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "admin dashboard",
    };
    const data = await Post.find();
    res.render("admin/dashboard", { locals, data, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;

//get /
//admin create new post

router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Add post",
    };
    const data = await Post.find();
    res.render("admin/add-post", { locals, layout: adminLayout });
  } catch (err) {
    console.log(err);
  }
});

//post /
//admin create new post
router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    try {
      const newPost = new Post({
        title: req.body.title,
        body: req.body.body,
      });

      await Post.create(newPost);
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
    }
  } catch (err) {
    console.log(err);
  }
});

//get /
//admin - edit post
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
    };
    const data = await Post.findById(req.params.id);
    res.render("admin/edit-post", {
      data,
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

//put /
//admin - edit post

router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now(),
    });
    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {}
});

//delete /
//Admin - delete post

router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

//get /
//Admin - logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json("Logout Successful!!");
  res.redirect("/");
});
