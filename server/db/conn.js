const mongoose = require("mongoose");
const DB = process.env.DATABASE||"mongodb://localhost:27017/codru";
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((err) => console.log("Connection Error:", err));
