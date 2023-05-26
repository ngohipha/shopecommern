const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
require("./connection");
require("dotenv").config();
const bodyParser = require('body-parser')
// require('dotenv').config();
// const stripe = require('stripe')(process.env.STRIPE_SECRET)
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const imageRoutes = require("./routes/imageRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["POST", "PUT", "GET", "DELETE"],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json())
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/images", imageRoutes);
app.use("/orders", orderRoutes);

server.listen(8080, () => {
  console.log("server running at port", 8080);
});

app.set("socketio", io);
