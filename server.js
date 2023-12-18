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

  const updateResult = await db
    .collection("users")
    .updateOne({ email: req.session.user.email }, { $set: updateFields });

  if (updateResult.modifiedCount === 1) {
    res.json({ success: true, message: "User updated successfully" });
  } else {
    res.status(500).json({ message: "Error updating user" });
  }
});

// ... rest of your code ...

let games = {}; // Temporary storage for games. Replace with actual database.

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("create", (data, callback) => {
    // Generate a unique game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store the game data along with the game code and creator's socket ID
    games[gameCode] = {
      ...data,
      code: gameCode,
      creator: socket.id,
      player: null,
      active: false,
    };

    console.log("Game created:", games[gameCode]);

    // Send the game code back to the client
    callback({ success: true, code: gameCode });
  });

  socket.on("join", (gameCode, callback) => {
    const game = games[gameCode];

    if (game && !game.active) {
      // If the game exists and is not active, add the player to the game
      game.player = socket.id;
      game.active = true;

      // Notify both players that the game has started
      io.to(game.creator).emit("gameStarted", game);
      io.to(game.player).emit("gameStarted", game);

      callback({ success: true });
    } else {
      // If the game does not exist or is already active, send an error
      callback({ error: "Invalid game code or game already started" });
    }
  });

  // ... rest of your code ...
});

server.listen(3001, () => {
  console.log("Server is running at port 3001");
});
