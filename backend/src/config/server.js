import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/clienteusuario", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clienteusuario');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo cliente" });
  }
});

// POST sirve para insertar platos
app.post("/api/clienteusuario", async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO clienteusuario (cedula,nombre,apellido,direccion,email,ciudad,password) VALUES (?,?,?,?,?,?,?) RETURNING *",
      [name, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando usuario cliente" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});