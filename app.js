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

const middleWareFunction = (request, response, next) => {
  const { username, password } = request.body;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    const jwtToken = authHeader.split(" ")[1];
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
};

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

app.get("/user/tweets/feed/", middleWareFunction, async (request, response) => {
  const { username } = request;
  const getDetailsQuery = `
       SELECT username, tweet, date_time as dateTime
       From user inner join tweet on user.user_id = tweet.user_id
       WHERE  username = '${username}'
       order by date_time DESC
       LIMIT 4;`;
  const result = await db.all(getDetailsQuery);
  response.send(result);
});

module.exports = app;
