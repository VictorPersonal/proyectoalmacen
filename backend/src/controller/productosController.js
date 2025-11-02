import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import multer from "../config/multer.js";

// 📦 Crear un nuevo producto
export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock } = req.body;
    let imagenUrl = null;

    // Si viene un archivo, lo subimos a Cloudinary
    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: "productos_dulcehogar",
      });
      imagenUrl = resultado.secure_url;
    }

    // Guardamos el producto en PostgreSQL
    const nuevoProducto = await pool.query(
      "INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, descripcion, precio, stock, imagenUrl]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Producto creado exitosamente",
      producto: nuevoProducto.rows[0],
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ ok: false, mensaje: "Error del servidor" });
  }
};

// 📋 Obtener todos los productos
export const obtenerProductos = async (req, res) => {
  try {
    const productos = await pool.query("SELECT * FROM productos ORDER BY id ASC");
    res.json(productos.rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// 🔍 Obtener producto por ID
export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);

    if (producto.rows.length === 0)
      return res.status(404).json({ mensaje: "Producto no encontrado" });

    res.json(producto.rows[0]);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// ✏️ Actualizar producto
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock } = req.body;
    let imagenUrl = req.body.imagenUrl || null;

    // Si viene una nueva imagen
    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: "productos_dulcehogar",
      });
      imagenUrl = resultado.secure_url;
    }

    const productoActualizado = await pool.query(
      "UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, stock=$4, imagen_url=$5 WHERE id=$6 RETURNING *",
      [nombre, descripcion, precio, stock, imagenUrl, id]
    );

    res.json({
      ok: true,
      mensaje: "Producto actualizado",
      producto: productoActualizado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// 🗑️ Eliminar producto
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM productos WHERE id = $1", [id]);
    res.json({ ok: true, mensaje: "Producto eliminado" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
