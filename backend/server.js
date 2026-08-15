require('dotenv').config();
const express = require('express');
const cors = require('cors');

const zonesRouter = require('./routes/zones');
const routeRouter = require('./routes/route');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/zones', zonesRouter);       // school/hospital zone schedules
app.use('/api/route', routeRouter);       // route calculation proxy (multi-option, traffic-aware)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MapNav backend listening on port ${PORT}`));

module.exports = app;
