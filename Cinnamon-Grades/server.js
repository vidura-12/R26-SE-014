const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const detectionRoutes = require("./routes/detectionRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// DB
mongoose.connect(process.env.MONGO_URI, {
  dbName: "cinnamonData",
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("Cinnamon Backend Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.use("/", detectionRoutes);

// Server
const PORT = process.env.PORT || 9000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;