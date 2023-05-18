const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
require("./connection");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', "DELETE"]
});
const User = require('./models/User');
const userRoutes = require('./routes/userRoutes')
const productRoutes = require('./routes/productRoutes')
const imageRoutes = require ('./routes/imageRoutes')


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/users', userRoutes)
app.use('/products', productRoutes)
app.use('/images' , imageRoutes)
server.listen(8080, () => {
  console.log("server running at port", 8080);
});

app.set('socketio',io)