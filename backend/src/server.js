require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)))
  .catch((err) => {
    console.error('Failed to start backend:', err.message);
    process.exit(1);
  });
