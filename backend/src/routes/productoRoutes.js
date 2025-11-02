import express from "express";
import { crearProducto, obtenerProductos } from "../models/productoModel.js";

const router = express.Router();

// Guardar producto
router.post("/productos", async (req, res) => {
  try {
    const { nombre, precio, stock, descripcion, idmarca, idcategoria, imagen_url } = req.body;
    const nuevoProducto = await crearProducto(nombre, precio, stock, descripcion, idmarca, idcategoria, imagen_url);
    res.json({ message: "✅ Producto agregado con éxito", producto: nuevoProducto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error al guardar producto", error });
  }
});

// Obtener todos los productos
router.get("/productos", async (req, res) => {
  try {
    const productos = await obtenerProductos();
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error al obtener productos", error });
  }
});

export default router;
