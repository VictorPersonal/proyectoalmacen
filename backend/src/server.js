const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 4000;



app.get('/', (req, res) => {
  res.send('Servidor funcionando con PostgreSQL 🚀');
});

app.use('/', require('./routes/router'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});