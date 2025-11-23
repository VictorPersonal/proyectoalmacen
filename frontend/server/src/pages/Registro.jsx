import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registro.css";
import logo from "../assets/Logo dulce hogar.png";

function Registro() {
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState({});
  const navigate = useNavigate();

  // Validaciones
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarCedula = (cedula) => {
    const regex = /^\d{1,10}$/;
    return regex.test(cedula);
  };

  const validarContrasena = (contrasena) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar email
    if (!email) {
      nuevosErrores.email = "El email es requerido";
    } else if (!validarEmail(email)) {
      nuevosErrores.email = "El email debe tener un formato válido (ejemplo: usuario@gmail.com)";
    }

    // Validar cédula
    if (!cedula) {
      nuevosErrores.cedula = "La cédula es requerida";
    } else if (!validarCedula(cedula)) {
      nuevosErrores.cedula = "La cédula debe tener máximo 10 dígitos numéricos";
    }

    // Validar nombre
    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre es requerido";
    } else if (nombre.trim().length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar contraseña
    if (!contrasena) {
      nuevosErrores.contrasena = "La contraseña es requerida";
    } else if (!validarContrasena(contrasena)) {
      nuevosErrores.contrasena = "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar cambio de cédula (solo números y máximo 10 dígitos)
  const handleCedulaChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCedula(valor);
    
    // Limpiar error de cédula si se está corrigiendo
    if (errores.cedula) {
      setErrores(prev => ({ ...prev, cedula: "" }));
    }
  };

  // Manejar cambio de contraseña
  const handleContrasenaChange = (e) => {
    setContrasena(e.target.value);
    
    // Limpiar error de contraseña si se está corrigiendo
    if (errores.contrasena) {
      setErrores(prev => ({ ...prev, contrasena: "" }));
    }
  };

  // Manejar cambio de email
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    
    // Limpiar error de email si se está corrigiendo
    if (errores.email) {
      setErrores(prev => ({ ...prev, email: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    
    // Validar el formulario antes de enviar
    if (!validarFormulario()) {
      setMensaje("Por favor, corrige los errores en el formulario ❌");
      return;
    }

    // Crear objeto sin email y contraseña
    const nuevoUsuario = {
      email,
      cedula,
      nombre,
      contrasena,
    };


    try {
      const res = await fetch("http://localhost:4000/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoUsuario),
      });

      if (res.status === 409) {
        setMensaje("La cédula ya está registrada ❌");
        return;
      }

      if (!res.ok) throw new Error("Error al registrar usuario");

      const data = await res.json();
      setMensaje("Cuenta creada exitosamente ✅");

      // Limpiar los campos
      setEmail("");
      setCedula("");
      setNombre("");
      setContrasena("");
      setErrores({});

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setMensaje("No se pudo registrar el usuario ❌");
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

          {mensaje && (
            <div
              style={{
                color: mensaje.includes("exitosamente") ? "green" : "red",
                marginBottom: "1rem",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {mensaje}
            </div>
          )}

          <form id="registro-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                placeholder="nombre@tucorreo.com"
                value={email}
                onChange={handleEmailChange}
                required
                className={errores.email ? "error-input" : ""}
              />
              {errores.email && <span className="error-message">{errores.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="cedula">Cédula:</label>
              <input
                type="text"
                id="cedula"
                value={cedula}
                onChange={handleCedulaChange}
                placeholder="Solo números, máximo 10 dígitos"
                required
                className={errores.cedula ? "error-input" : ""}
              />
              {errores.cedula && <span className="error-message">{errores.cedula}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre completo:</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errores.nombre) {
                    setErrores(prev => ({ ...prev, nombre: "" }));
                  }
                }}
                required
                className={errores.nombre ? "error-input" : ""}
              />
              {errores.nombre && <span className="error-message">{errores.nombre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contrasena">Contraseña:</label>
              <input
                type="password"
                id="contrasena"
                value={contrasena}
                onChange={handleContrasenaChange}
                required
                className={errores.contrasena ? "error-input" : ""}
              />
              <small id="hint">
                Al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)
              </small>
              {errores.contrasena && <span className="error-message">{errores.contrasena}</span>}
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