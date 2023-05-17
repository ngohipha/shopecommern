const mongoose = require("mongoose");

const connectionStr = "mongodb+srv://admin:admin@cluster0.k1px7zy.mongodb.net/";

mongoose
  .connect(connectionStr, { useNewUrlparser: true })
  .then(() => console.log("connect DB"))
  .catch((err) => console.log(err));

  mongoose.connection.on('error',err => {
    console.log(err)
  })