import { supabase } from "../config/db.js";

// Insertar producto con imagen de Cloudinary
export const crearProducto = async (nombre, precio, stock, descripcion, idmarca, idcategoria, imagen_url) => {
  const query = `
    INSERT INTO producto (nombre, precio, stock, descripcion, idmarca, idcategoria, imagen_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [nombre, precio, stock, descripcion, idmarca, idcategoria, imagen_url];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Obtener todos los productos
export const obtenerProductos = async () => {
  const { rows } = await pool.query("SELECT * FROM producto ORDER BY idproducto DESC;");
  return rows;
};
