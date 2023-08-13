require("dotenv").config();

const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const compression = require("compression");

const app = express();

//some middlewares
app.use(cors());
app.use(compression());

const PORT = process.env.PORT || 8000;

//now establish the connection with db

mongoose
  .connect(process.env.URI)
  .then(() => {
    console.info("mongo db connected");
    app.listen(PORT, () => {
      console.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`ouch mongo db connection failed: ${err}`);
  });
