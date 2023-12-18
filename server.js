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

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomCode) => {
    socket.join(roomCode);
  });
});

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "html")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/ressources", express.static(path.join(__dirname, "ressources")));

app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const uri =
  "mongodb+srv://admin:admin@nameanimalthing.rhe4bnc.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

db = client.db("nameanimalthing");

app.get("/home", (req, res) => {
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

app.get("/creategame", (req, res) => {
  if (!req.session.user) {
    res.redirect("/signin");
    return;
  }

  res.sendFile(__dirname + "/html/creategame.html");
});

app.post("/creategame", async (req, res) => {
  const { categories, totalRounds } = req.body;

  const creator = {
    _id: req.session.user._id,
    username: req.session.user.username,
  };

  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const game = {
    roomCode,
    categories,
    totalRounds,
    currentRound: 0,
    players: [{ ...creator, score: 0 }],
    rounds: [],
    status: "waiting",
    createdAt: new Date(),
  };

  console.log(game);

  const result = await db.collection("games").insertOne(game);

  if (result.acknowledged) {
    res.json({
      success: true,
      message: "Game created successfully",
      roomCode,
      redirect: `/waitingroom?roomCode=${roomCode}`,
    });
  } else {
    res.json({ success: false, message: "Error creating game" });
  }
});

app.get("/joinroom", (req, res) => {
  if (!req.session.user) {
    res.redirect("/signin");
    return;
  }
  res.sendFile(__dirname + "/html/joinroom.html");
});

app.post("/joinroom", async (req, res) => {
  console.log(req.session.user);
  const { roomCode } = req.body;

  const game = await db.collection("games").findOne({ roomCode });
  if (!game) {
    res.json({ success: false, message: "Room does not exist" });
    return;
  }

  if (game.status !== "waiting") {
    res.json({ success: false, message: "Game has already started" });
    return;
  }

  const player = {
    _id: req.session.user._id,
    username: req.session.user.username,
    score: 0,
  };

  const result = await db
    .collection("games")
    .updateOne({ roomCode }, { $push: { players: player } });

  if (result.modifiedCount === 1) {
    io.to(roomCode).emit("playerJoined", player);
    res.json({
      success: true,
      message: "Joined room successfully",
      redirect: `/waitingroom?roomCode=${roomCode}`,
    });
  } else {
    res.json({ success: false, message: "Error joining room" });
  }
});

app.get("/waitingroom", (req, res) => {
  if (!req.session.user) {
    res.redirect("/signin");
    return;
  }
  res.sendFile(__dirname + "/html/waitingroom.html");
});

app.get("/api/waitingroom", async (req, res) => {
  const { roomCode } = req.query;

  const game = await db.collection("games").findOne({ roomCode });
  if (!game) {
    res.status(404).json({ message: "Room not found" });
    return;
  }

  const isCreator =
    req.session.user._id.toString() === game.players[0]._id.toString();

  res.json({ game, isCreator });
});

app.get("/howtoplay", (req, res) => {
  res.sendFile(__dirname + "/html/howtoplay.html");
});

const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

app.post("/api/startgame", async (req, res) => {
  const { roomCode } = req.body;

  const game = await db.collection("games").findOne({ roomCode });
  if (!game) {
    res.json({ success: false, message: "Game does not exist" });
    return;
  }

  if (game.status !== "waiting") {
    res.json({ success: false, message: "Game has already started" });
    return;
  }

  const letter = alphabet[Math.floor(Math.random() * alphabet.length)];

  const round = {
    roundNumber: game.currentRound + 1,
    letter,
    status: "active",
    playerResponses: [],
  };

  const result = await db.collection("games").updateOne(
    { roomCode },
    {
      $set: { status: "active", currentRound: round.roundNumber },
      $push: { rounds: round },
    }
  );

  if (result.modifiedCount === 1) {
    io.to(roomCode).emit("gameStarted", {
      letter,
      categories: game.categories,
    });
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Error starting game" });
  }
});

app.get("/signout", (req, res) => {
  console.log(req.session);
  req.session.destroy((err) => {
    if (err) {
      // Handle the error case
      res.status(500).send("Could not sign out. Please try again.");
    } else {
      res.redirect("/home");
      console.log(req.session); // Redirect to home page after signing out
    }
  });
});

server.listen(3001, () => {
  console.log("Server is running at port 3001");
});
