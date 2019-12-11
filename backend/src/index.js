// let's go!
const cookieParser = require("cookie-parser");

require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");
const jwt = require("jsonwebtoken");

const server = createServer();
server.express.use(cookieParser());

server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    req.userId = userId;
  }
  next();
});

server.express.use(async (req, res, next) => {
  // if they aren't logged in, skip this
  if (!req.userId) return next();
  const user = await db.query.user(
    { where: { id: req.userId } },
    "{ id, permissions, email, name }"
  );
  req.user = user;
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  serverDetails => {
    console.log(
      `server is now running on  http://localhost:${serverDetails.port}`
    );
  }
);
