require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const userLoginRoutes = require('./Routes/userLoginRoutes');
const floodDataRoutes = require('./Routes/floodDataRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/userLoginRoutes', userLoginRoutes);
app.use('/api/flood', floodDataRoutes);

// Serve React build
app.use(express.static(path.join(__dirname, '../Front_End/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Front_End/build', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
