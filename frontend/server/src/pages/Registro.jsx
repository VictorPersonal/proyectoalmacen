import { useState } from "react";
import "./Registro.css";
import logo from "../assets/Logo dulce hogar.png";

function Registro() {
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevoUsuario = {
      email,
      cedula,      // ✅ ahora enviamos cedula
      nombre,
      contrasena,
    };

    try {
      const res = await fetch("http://localhost:4000/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoUsuario),
      });

      if (!res.ok) throw new Error("Error al registrar usuario");

      const data = await res.json();
      console.log("Usuario registrado:", data);
      alert("Cuenta creada exitosamente ✅");

      // limpiar los campos
      setEmail("");
      setCedula("");
      setNombre("");
      setContrasena("");
    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo registrar el usuario ❌");
    }
  };

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

          <form id="registro-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                placeholder="nombre@tucorreo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cedula">Cédula:</label>
              <input
                type="text"
                id="cedula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contrasena">Contraseña:</label>
              <input
                type="password"
                id="contrasena"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
              <small id="hint">
                Al menos 8 caracteres (MAYÚSCULAS, minúsculas...)
              </small>
            </div>

            <button type="submit" id="btn-registrar">
              Registrar
            </button>
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
        <div id="footer-copy">© 2025 FHO, todos los derechos reservados</div>
      </footer>
    </>
  );
}

export default Registro;
