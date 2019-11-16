const express = require("express");
const mongoose = require("mongoose");

const users = require("./routes/api/users");
const posts = require("./routes/api/posts");
const profile = require("./routes/api/profile");

const app = express();

// DB Config
const db = require("./config/keys").mongoURI;

// Connecting to MongoDB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => "MonoDB Connected")
  .catch(err => console.log(err));

app.get("/", (req, res) => res.send("Hello!"));

app.use("/api/users", users);
app.use("/api/posts", posts);
app.use("/api/profile", profile);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening to port ${port}`));
