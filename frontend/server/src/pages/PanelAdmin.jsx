import React from "react";
import "./PanelAdmin.css";

const PanelAdmin = () => {
  return (
    <div className="admin-panel">
      {/* Sidebar */}
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
        {/* === Encabezado con botones === */}
        <header className="top-header">
          <div className="action-buttons">
            <button className="btn-action btn-add">
              <span className="btn-icon">➕</span> Agregar producto
            </button>
            <button className="btn-action btn-delete">
              <span className="btn-icon">✖</span> Eliminar producto
            </button>
            <button className="btn-action btn-edit">
              <span className="btn-icon">✏</span> Modificar producto
            </button>
          </div>

          <div className="help-icon">?</div>
        </header>


        <div className="search-wrapper">
          <div className="search-container" id="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Buscar productos..." />
          </div>
        </div>

        {/* === Tabla de productos === */}
        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Samsung Smart TV 55</td>
                <td>10000</td>
                <td>4</td>
                <td>Televisor</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Samsung EcoBubble</td>
                <td>200000</td>
                <td>2</td>
                <td>Lavadora</td>
              </tr>
              <tr>
                <td>3</td>
                <td>LG Refrigerador</td>
                <td>350000</td>
                <td>3</td>
                <td>Refrigerador</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Microondas Panasonic</td>
                <td>45000</td>
                <td>8</td>
                <td>Microondas</td>
              </tr>
              <tr>
                <td>5</td>
                <td>Aspiradora Dyson</td>
                <td>120000</td>
                <td>5</td>
                <td>Aspiradora</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* === Paginación === */}
        <div className="pagination">
          <button className="page-btn">‹</button>
          <span className="page-number active">1</span>
          <span className="page-number">2</span>
          <button className="page-btn">›</button>
        </div>
      </main>
    </div>
  );
};

export default PanelAdmin;
