const express = require('express');
const app = express();
const PORT = 4000;


app.get('/', (req, res) => {
  res.send('Servidor funcionando con PostgreSQL 🚀');
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});