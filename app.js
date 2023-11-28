const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.use(express.json());

const dbpath = path.join(__dirname, "twitterClone.db");
let db = null;

const InitializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`dberror : ${e.message}`);
    process.exit(1);
  }
};
InitializeAndStartServer();

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const getUserQuery = `
        SELECT *
        FROM user
        where 
        username = '${username}';`;
  const result = await db.get(getUserQuery);
  if (result === undefined) {
    if (password.length > 5) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedQuery = `
          INSERT INTO user(username, password, name, gender) 
          VALUES(
             '${username}',
             '${password}',
             '${name}',
             '${gender}'
              );`;
      const data = await db.run(updatedQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
       SELECT *
       FROM user
       WHERE
       username = '${username}';`;
  const result = await db.get(userQuery);

  if (result !== undefined) {
    const hashedPassword = await bcrypt.compare(password, result.password);
    if (hashedPassword === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "kavyadanuguri");
      response.send({ jwtToken });
      console.log(jwtToken);
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

module.exports = app;
