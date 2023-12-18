const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient } = require("mongodb");
const session = require("express-session");

const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "html")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/ressources", express.static(path.join(__dirname, "ressources")));

const uri =
  "mongodb+srv://admin:admin@nameanimalthing.rhe4bnc.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

db = client.db("nameanimalthing");

app.use(
  session({
    secret: "sha256",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/html/index.html");
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/html/signup.html");
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const user = await db.collection("users").findOne({ email });
  if (user) {
    res.json({ success: false, message: "User already exists" });
    return;
  }

  const result = await db
    .collection("users")
    .insertOne({ username, email, password });
  if (result.acknowledged) {
    res.json({
      success: true,
      message: "User created successfully",
      redirect: "/signin",
    });
  } else {
    res.json({ success: false, message: "Error creating user" });
  }
});

app.get("/signin", (req, res) => {
  res.sendFile(__dirname + "/html/signin.html");
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await db.collection("users").findOne({ email });
  if (!user) {
    res.json({ success: false, message: "User does not exist" });
    return;
  }

  const isPasswordMatch = password == user.password;
  if (!isPasswordMatch) {
    res.json({ success: false, message: "Incorrect password" });
    return;
  }

  const userSession = { ...user };
  delete userSession._id;

  req.session.user = userSession;

  res.json({
    success: true,
    message: "User signed in successfully",
    redirect: "/dashboard",
  });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    res.redirect("/signin");
    return;
  }
  res.sendFile(__dirname + "/html/dashboard.html");
});

app.get("/viewprofile", (req, res) => {
  if (!req.session.user) {
    res.redirect("/signin");
    return;
  }
  res.sendFile(__dirname + "/html/viewprofile.html");
});

app.get("/api/user", async (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const user = await db
    .collection("users")
    .findOne({ email: req.session.user.email });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

app.get("/contact", (req, res) => {
  if (!req.session.user) {
    res.redirect("/signin");
    return;
  }

  res.sendFile(__dirname + "/html/contactus.html");
});

app.post("/contact", async (req, res) => {
  const { username, email, message } = req.body;

  try {
    // Assuming you have a collection named "contactMessages"
    const result = await db.collection("contactMessages").insertOne({
      username,
      email,
      message,
    });

    if (result.acknowledged) {
      res.json({
        success: true,
        message: "Message sent successfully",
        redirect: "/dashboard",
      });
    } else {
      res.json({
        success: false,
        message: "Failed to send message",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.put("/api/user", async (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const updateFields = {};
  for (let key in req.body) {
    updateFields[key] = req.body[key];
  }

  if (updateFields.email) {
    const existingUser = await db
      .collection("users")
      .findOne({ email: updateFields.email });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }
  }

  const updateResult = await db
    .collection("users")
    .updateOne({ email: req.session.user.email }, { $set: updateFields });

  if (updateResult.modifiedCount === 1) {
    res.json({ success: true, message: "User updated successfully" });
  } else {
    res.status(500).json({ message: "Error updating user" });
  }
});

app.listen(3001, () => {
  console.log("Server is running at port 3001");
});
