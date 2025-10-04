import "./Registro.css";
import logo from "../assets/Logo dulce hogar.png";

function Registro() {
  return (
    <>
      <header id="top-bar">
        <div id="logo-section">
          <img src={logo} alt="Dulce hogar logo" id="logo-img" />
          <div id="logo-text">
            <span id="logo-title">Dulce hogar</span>
            <span id="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div id="help-icon">?</div>
      </header>

      <main id="container">
        <div id="form-wrapper">
          <h1 id="form-title">Crear Cuenta</h1>

          <form id="registro-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" placeholder="nombre@tucorreo.com" />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono:</label>
              <input type="tel" id="telefono" />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              <input type="text" id="nombre" />
            </div>

            <div className="form-group">
              <label htmlFor="contrasena">Contraseña:</label>
              <input type="password" id="contrasena" />
              <small id="hint">
                Al menos 8 caracteres (MAYÚSCULAS, minúsculas...)
              </small>
            </div>

            <button type="submit" id="btn-registrar">Registrar</button>
          </form>
        </div>
      </main>

      <footer id="footer">
        <div id="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div id="footer-copy">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </>
  );
}

export default Registro;
