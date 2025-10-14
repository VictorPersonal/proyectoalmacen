import React, { useState, useEffect } from "react";
import "./PanelAdmin.css";
import axios from "axios"; // Asegúrate de instalarlo: npm install axios

const PanelAdmin = () => {
  // Estado de productos (inicialmente vacío, se cargará desde el backend)
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", precio: "", stock: "", categoria: "" });
  const [currentId, setCurrentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar productos desde el backend al montar el componente
  useEffect(() => {
    axios.get("http://localhost:5000/api/producto")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error al cargar productos:", err));
  }, []);

  // Filtro de búsqueda
  const filteredProducts = products.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Abrir modal para agregar/editar
  const handleShowModal = (product = null) => {
    setCurrentId(product?.idproducto || null);
    setFormData(product || { nombre: "", precio: "", stock: "", categoria: "" });
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nombre: "", precio: "", stock: "", categoria: "" });
    setCurrentId(null);
  };

  // Guardar (agregar o editar)
  const handleSave = () => {
    if (!formData.nombre || !formData.precio || !formData.stock || !formData.categoria) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const payload = {
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      categoria: formData.categoria,
      // Nota: idmarca e idcategoria no están en el formulario actual, ajusta si los necesitas
    };

    if (currentId) {
      // Editar
      axios.put(`http://localhost:5000/api/producto/${currentId}`, payload)
        .then(() => {
          setProducts(products.map((p) => p.idproducto === currentId ? { ...p, ...payload } : p));
          handleCloseModal();
        })
        .catch((err) => console.error("Error al actualizar:", err));
    } else {
      // Agregar
      axios.post("http://localhost:5000/api/producto", payload)
        .then((res) => {
          setProducts([...products, { idproducto: res.data.producto.idproducto, ...payload }]);
          handleCloseModal();
        })
        .catch((err) => console.error("Error al crear:", err));
    }
  };

  // Eliminar
  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      axios.delete(`http://localhost:5000/api/producto/${id}`)
        .then(() => {
          setProducts(products.filter((p) => p.idproducto !== id));
        })
        .catch((err) => console.error("Error al eliminar:", err));
    }
  };

  return (
    <div className="admin-panel">
      <aside className="sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">👤</div>
          <span className="admin-name">Admin Enrique</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">📦</span> Productos
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📊</span> Dashboard
          </a>
        </nav>
      </aside>

      <main className="main-content">
        <div className="search-wrapper">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="form-wrapper">
          <button className="btn btn--add" onClick={() => handleShowModal()}>
            ➕ Agregar
          </button>
        </div>

        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <tr key={product.idproducto}>
                    <td>{product.idproducto}</td>
                    <td>{product.nombre}</td>
                    <td>{product.precio}</td>
                    <td>{product.stock}</td>
                    <td>{product.categoria || "Sin categoría"}</td>
                    <td className="actions-cell">
                      <button className="btn btn--edit" onClick={() => handleShowModal(product)}>
                        ✏️
                      </button>
                      <button className="btn btn--delete" onClick={() => handleDelete(product.idproducto)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <span
              key={index + 1}
              className={`page-number ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </span>
          ))}
          <button
            className="page-btn"
            onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      </main>

      {/* Modal para agregar/editar */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{currentId ? "Editar Producto" : "Agregar Producto"}</h3>
            <input
              type="text"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <input
              type="number"
              placeholder="Precio"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            />
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
            <input
              type="text"
              placeholder="Categoría"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            />
            <div className="modal-actions">
              <button className="btn btn--add" onClick={handleSave}>
                💾 Guardar
              </button>
              <button className="btn btn--delete" onClick={handleCloseModal}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdmin;