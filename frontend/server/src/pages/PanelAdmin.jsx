import React, { useState, useEffect } from "react";
import "./PanelAdmin.css";
import Dashboard from "../components/dashboard";
import axios from "axios";

const PanelAdmin = () => {
  const [currentSection, setCurrentSection] = useState("productos");
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
    idcategoria: "",
    idmarca: "",
    imagen: null,
  });

  // Traer productos al cargar el componente
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/productos");
        setProducts(res.data);
      } catch (err) {
        console.error("Error al obtener productos:", err.response?.data || err.message);
      }
    };
    fetchProducts();
  }, []);

  // Manejar cambios de input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Guardar producto (crear o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      if (formData[key]) data.append(key, formData[key]);
    }

    try {
      if (editingProduct) {
        // Editar producto
        const res = await axios.put(
          `http://localhost:4000/api/productos/${editingProduct.idproducto}/con-imagen`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setProducts(products.map(p => p.idproducto === editingProduct.idproducto ? res.data.producto : p));
        setEditingProduct(null);
      } else {
        // Crear producto
        const res = await axios.post(
          "http://localhost:4000/api/productos/con-imagen",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setProducts([...products, res.data.producto]);
      }
      setModalVisible(false);
      setFormData({
        nombre: "",
        precio: "",
        stock: "",
        descripcion: "",
        idcategoria: "",
        idmarca: "",
        imagen: null,
      });
    } catch (err) {
      console.error("Error al guardar producto:", err.response?.data || err.message);
      alert("Error al guardar producto");
    }
  };

  // Eliminar producto
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/productos/${id}`);
      setProducts(products.filter(p => p.idproducto !== id));
    } catch (err) {
      console.error("Error al eliminar producto:", err.response?.data || err.message);
      alert("Error al eliminar producto");
    }
  };

  // Preparar formulario para editar
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      precio: product.precio,
      stock: product.stock,
      descripcion: product.descripcion || "",
      idcategoria: product.idcategoria,
      idmarca: product.idmarca || "",
      imagen: null,
    });
    setModalVisible(true);
  };

  // Paginación
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="admin-panel">
      <aside className="sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">👤</div>
          <span className="admin-name">Admin Enrique</span>
        </div>
        <nav className="sidebar-nav">
          <a
            href="#"
            className={`nav-item ${currentSection === "productos" ? "active" : ""}`}
            onClick={() => setCurrentSection("productos")}
          >
            📦 Productos
          </a>
          <a
            href="#"
            className={`nav-item ${currentSection === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentSection("dashboard")}
          >
            📊 Dashboard
          </a>
        </nav>
      </aside>

      <main className="main-content">
        {currentSection === "productos" && (
          <>
            <div className="form-wrapper">
              <button className="btn btn--add" onClick={() => setModalVisible(true)}>➕ Agregar</button>
            </div>

            <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length === 0 ? (
                    <tr><td colSpan="7">No hay productos</td></tr>
                  ) : (
                    currentProducts.map(prod => (
                      <tr key={prod.idproducto}>
                        <td>{prod.idproducto}</td>
                        <td>{prod.imagen_url && <img src={prod.imagen_url} alt={prod.nombre} width="50" />}</td>
                        <td>{prod.nombre}</td>
                        <td>${prod.precio}</td>
                        <td>{prod.stock}</td>
                        <td>{prod.idcategoria}</td>
                        <td>
                          <button className="btn btn--edit" onClick={() => handleEdit(prod)}>✏️ Editar</button>
                          <button className="btn btn--delete" onClick={() => handleDelete(prod.idproducto)}>🗑️ Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button className="page-btn" onClick={handlePrevPage} disabled={currentPage === 1}>‹</button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>›</button>
            </div>
          </>
        )}

        {currentSection === "dashboard" && <Dashboard />}
      </main>

      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingProduct ? "Editar Producto" : "Agregar Producto"}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
              <input type="number" name="precio" placeholder="Precio" value={formData.precio} onChange={handleChange} required />
              <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} required />
              <input type="text" name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
              <input type="number" name="idcategoria" placeholder="ID Categoría" value={formData.idcategoria} onChange={handleChange} required />
              <input type="number" name="idmarca" placeholder="ID Marca" value={formData.idmarca} onChange={handleChange} />
              <input type="file" name="imagen" accept="image/*" onChange={handleChange} />
              <div className="modal-actions">
                <button type="submit" className="btn btn--add">💾 Guardar</button>
                <button type="button" className="btn btn--delete" onClick={() => {setModalVisible(false); setEditingProduct(null);}}>❌ Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdmin;
