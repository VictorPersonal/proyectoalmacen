import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Registro.css";
import logo from "../assets/Logo dulce hogar.png";
import Swal from "sweetalert2";

function Registro() {
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // 🔹 Función para mostrar alertas de éxito
  const mostrarExito = (mensaje) => {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Aceptar',
      timer: 3000,
      timerProgressBar: true
    });
  };

  // 🔹 Función para mostrar alertas de error
  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Entendido'
    });
  };

  // 🔹 Función para mostrar confirmación
  const mostrarConfirmacion = () => {
    return Swal.fire({
      title: '¿Crear cuenta?',
      text: "¿Estás seguro de que quieres crear una nueva cuenta?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D84040',
      cancelButtonColor: '#666',
      confirmButtonText: 'Sí, crear cuenta',
      cancelButtonText: 'Cancelar'
    });
  };

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

    // Validar términos y condiciones
    if (!aceptoTerminos) {
      nuevosErrores.terminos = "Debes aceptar los términos y condiciones para registrarte";
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

  // Manejar cambio de términos y condiciones
  const handleTerminosChange = (e) => {
    setAceptoTerminos(e.target.checked);
    
    // Limpiar error de términos si se está corrigiendo
    if (errores.terminos) {
      setErrores(prev => ({ ...prev, terminos: "" }));
    }
  };

  // Función para navegar a la página de términos y condiciones
  const navegarATerminos = () => {
    navigate("/registro/terminosycondiciones");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar el formulario antes de enviar
    if (!validarFormulario()) {
      mostrarError("Por favor, corrige los errores en el formulario");
      return;
    }

    // Mostrar confirmación antes de registrar
    const confirmacion = await mostrarConfirmacion();
    if (!confirmacion.isConfirmed) {
      return;
    }

    setCargando(true);

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
        mostrarError("La cédula ya está registrada");
        return;
      }

      if (!res.ok) throw new Error("Error al registrar usuario");

      const data = await res.json();
      
      // Mostrar mensaje de éxito
      mostrarExito("Cuenta creada exitosamente");

      // Limpiar los campos
      setEmail("");
      setCedula("");
      setNombre("");
      setContrasena("");
      setAceptoTerminos(false);
      setErrores({});

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      mostrarError("No se pudo registrar el usuario");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-page-wrapper">
      <header className="registro-top-bar">
        <div className="registro-logo-section">
          <img src={logo} alt="Dulce hogar logo" className="registro-logo-img" />
          <div className="registro-logo-text">
            <span className="registro-logo-title">Dulce hogar</span>
            <span className="registro-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="registro-help-icon">?</div>
      </header>

      <main className="registro-container">
        <div className="registro-form-wrapper">
          <h1 className="registro-form-title">Crear Cuenta</h1>

          <form className="registro-form" onSubmit={handleSubmit}>
            <div className="registro-form-group">
              <label htmlFor="registro-email">Email:</label>
              <input
                type="email"
                id="registro-email"
                placeholder="nombre@tucorreo.com"
                value={email}
                onChange={handleEmailChange}
                required
                disabled={cargando}
                className={errores.email ? "registro-error-input" : ""}
              />
              {errores.email && <span className="registro-error-message">{errores.email}</span>}
            </div>

            <div className="registro-form-group">
              <label htmlFor="registro-cedula">Cédula:</label>
              <input
                type="text"
                id="registro-cedula"
                value={cedula}
                onChange={handleCedulaChange}
                placeholder="Solo números, máximo 10 dígitos"
                required
                disabled={cargando}
                className={errores.cedula ? "registro-error-input" : ""}
              />
              {errores.cedula && <span className="registro-error-message">{errores.cedula}</span>}
            </div>

            <div className="registro-form-group">
              <label htmlFor="registro-nombre">Nombre completo:</label>
              <input
                type="text"
                id="registro-nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errores.nombre) {
                    setErrores(prev => ({ ...prev, nombre: "" }));
                  }
                }}
                required
                disabled={cargando}
                className={errores.nombre ? "registro-error-input" : ""}
              />
              {errores.nombre && <span className="registro-error-message">{errores.nombre}</span>}
            </div>

            <div className="registro-form-group">
              <label htmlFor="registro-contrasena">Contraseña:</label>
              <input
                type="password"
                id="registro-contrasena"
                value={contrasena}
                onChange={handleContrasenaChange}
                required
                disabled={cargando}
                className={errores.contrasena ? "registro-error-input" : ""}
              />
              
              {/* Mensaje de sugerencia */}
              <small className="registro-password-hint">
                Al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)
              </small>
              {errores.contrasena && <span className="registro-error-message">{errores.contrasena}</span>}
            </div>

            {/* Checkbox de Términos y Condiciones - SEPARADO DEL GRUPO DE CONTRASEÑA */}
            <div className="registro-terminos-group">
              <label className="registro-terminos-label">
                <input
                  type="checkbox"
                  checked={aceptoTerminos}
                  onChange={handleTerminosChange}
                  disabled={cargando}
                  className="registro-terminos-checkbox"
                />
                <span className="registro-terminos-text">
                  Acepto los{" "}
                  <span 
                    className="registro-terminos-link" 
                    onClick={navegarATerminos}
                  >
                    términos y condiciones
                  </span>
                </span>
              </label>
              {errores.terminos && <span className="registro-error-message">{errores.terminos}</span>}
            </div>

            <button 
              type="submit" 
              className="registro-btn-registrar"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <div className="registro-spinner"></div>
                  Creando cuenta...
                </>
              ) : (
                "Registrar"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="registro-footer">
        <div className="registro-footer-links">
          <Link to="/Consejo-de-Seguridad">Consejo de Seguridad</Link>
          <span>/</span>
          <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
          <span>/</span>
          <Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link>
        </div>
        <div className="registro-footer-copyright">
          © 2025 FDO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}

export default Registro;