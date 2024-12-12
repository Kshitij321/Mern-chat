const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv=require('dotenv');
const cors = require("cors");
const usermodel = require("./models/user");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const MessageModel = require("./models/Message");
const { clearTimeout } = require("timers");
const fs = require("fs");
const path=require('path');

dotenv.config();
app.use(express.json());
app.use(cookieparser()); // to parse the cookies coming from request to js objects
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use("/uploads", express.static(__dirname + "/uploads"));


const dirname=path.resolve();
app.use(express.static(path.join(dirname,"/client/dist")));
app.use('*',(_,res)=>{
  res.sendFile(path.resolve(dirname,"client","dist","index.html"))
})
//express.static used to server the static files
//it makes certain url file or folder available for the anyone to access
//for server

async function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

//when this route hit then
//grab the token from the req
//verify it and send the info back to the user
//userData is the decoded info of the token

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.get("/people", async (req, res) => {
  const users = await usermodel.find({}, { _id: 1, username: 1 });
  res.json(users);
});
//take out messages from DB according to the userid from request and
// the our id
//then sort them in ascending order from the oldest to newest (createdAt:1)
app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;

  const userData = await getUserDataFromReq(req);
  const ourUserId = userData.id;

  const messages = await MessageModel.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});
//login a user
//check the password and db password
//then create a token
//create a cookie and send the token inside it
//and some json data if we want
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const foundUser = await usermodel.findOne({ username });
    if (foundUser) {
      const passok = await bcrypt.compare(password, foundUser.password);
      if (passok) {
        const token = jwt.sign(
          { username: foundUser.username, id: foundUser._id },
          process.env.JWT_secret,
          {
            expiresIn: "24h",
          }
        );
        res
          .cookie("token", token, {
            sameSite: "None",
            secure: true,
            httpOnly: true,
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 7,
          })
          .json({
            message: "User Logged in",
            token,
            foundUser,
            id: foundUser._id,
          });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .json("ok");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Create the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await usermodel.create({ username, password: hashedPassword });

    // Sign the JWT token
    const token = jwt.sign(
      { username: user.username, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set the token in the cookie
    //sameSite allows to send cookies cross-origin
    res.cookie("token", token, {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    // secure: true for HTTPS

    // Send the response
    res.status(201).json({
      message: "User created",
      token,
      user,
      id: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
const server = app.listen(4000, () => {
  console.log("listening to port 4000");
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {})
  .catch((err) => {
    throw err;
  });

//websocket is a persistent,duplex TCP connection
//to send data from client and server without creating new connection everytime
//which was happening in the http
//it is generally used in the real time connection,where data must be sent
//continously from both the sides

//creating a web socket server
//then 'connection is the event'
//server is the isntance of the http server we created above

//take out cookies from the header then
//then extract one token from it and verify it to get the original userdata

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  // convert the clients deatils to an array and print only the username
  // console.log([...wss.clients].map(c=>c.username));
  //then send the object "online" as the json string and
  //for each client send the id and the username for that client
  const notifyAboutOnlinePeople = () => {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.id,
            username: c.username,
          })),
        })
      );
    });
  };

  connection.isAlive = true;
  //set a isAlive property for an connection as true
  // create a 'timer' which pings continously after 5s for 'pong'
  //if just after 1sec of ping not recieves the pong then it is marked as
  // dead by making 'isAlive' true and terminating the connection
  //else if 'pong'recieved' then we clear the 'death timer'
  //'ping' and 'pong' are reserved keywords

  connection.timer = setTimeout(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      if (!connection.isAlive) {
        connection.terminate();
        notifyAboutOnlinePeople();
      }
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer); // Only clear if pong is received
  });

  const cookies = req.headers.cookie;
  const tokenCookieString = cookies
    .split(";")
    .find((str) => str.startsWith("token="));
  if (tokenCookieString) {
    const token = tokenCookieString.split("=")[1]; // part before '=' has index 0 and the part after it has index 1
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
        if (err) throw err;
        const { id, username } = userData;

        connection.id = id;
        connection.username = username;
      });
    }
  }

  connection.on("close", () => {
    notifyAboutOnlinePeople();
  });
  let filename = null;
  connection.on("message", async (msg) => {
    const msgData = JSON.parse(msg.toString());
    const { recipient, text, file } = msgData;
    if (file) {
      const parts = file.name.split(".");
      const extension = parts[parts.length - 1];
      filename = Date.now() + "." + extension;
      const path = __dirname + "/uploads/" + filename; // __dirname gives absolute path to this current file
      const bufferData = Buffer.from(file.data.split(",")[1], "base64");
      fs.writeFile(path, bufferData, () => {});
    }
    if (recipient && (text || file)) {
      const MessageDoc = await MessageModel.create({
        sender: connection.id,
        recipient,
        text,
        file: file ? filename : null,
      });
      [...wss.clients]
        .filter((c) => c.id === recipient)
        .forEach((cl) =>
          cl.send(
            JSON.stringify({
              text,
              sender: connection.id,
              _id: MessageDoc._id,
              file: file ? filename : null,
              recipient,
            })
          )
        );
    }
  });
  notifyAboutOnlinePeople();
});
