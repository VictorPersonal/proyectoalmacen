import { useState, useEffect } from "react";
import "./ActualizarDatos.css";
import logo from "../assets/Logo dulce hogar.png";
import { useNavigate } from "react-router-dom";

function ActualizarPerfil() {
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // Función para obtener el email desde la base de datos
  const obtenerEmailDesdeBD = async (cedulaUsuario) => {
    try {
      const res = await fetch(`http://localhost:4000/api/usuario/perfil?cedula=${cedulaUsuario}`);
      if (res.ok) {
        const datos = await res.json();
        return datos.email || "";
      }
    } catch (error) {
      console.error("Error al obtener email:", error);
    }
    return "";
  };

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      try {
        // Obtener información del usuario del localStorage
        const usuarioGuardado = localStorage.getItem('usuarioInfo');
        
        if (!usuarioGuardado) {
          setMensaje("No hay usuario logueado. Redirigiendo al login...");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const usuario = JSON.parse(usuarioGuardado);
        
        console.log("Usuario del localStorage:", usuario); // Para debug
        
        // Usar los datos del localStorage directamente
        setNombre(usuario.nombre || "");
        setApellido(usuario.apellido || "");
        setCedula(usuario.cedula || "");
        setDireccion(usuario.direccion || "");
        setCiudad(usuario.ciudad || "");
        
        // Si no hay email en localStorage, obtenerlo de la BD
        if (!usuario.email) {
          const emailBD = await obtenerEmailDesdeBD(usuario.cedula);
          setEmail(emailBD);
          
          // Actualizar localStorage con el email
          if (emailBD) {
            const usuarioActualizado = { ...usuario, email: emailBD };
            localStorage.setItem('usuarioInfo', JSON.stringify(usuarioActualizado));
          }
        } else {
          setEmail(usuario.email);
        }
        
        setMensaje(""); // Limpiar mensajes anteriores
        
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
        setMensaje("Error al cargar los datos del perfil ❌");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [navigate]);

  // ... el resto del código permanece igual
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(""); // Limpiar mensaje anterior

    // Obtener el usuario del localStorage para tener la cédula
    const usuarioGuardado = localStorage.getItem('usuarioInfo');
    if (!usuarioGuardado) {
      setMensaje("Error: No se encontró la información del usuario");
      setCargando(false);
      return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    const datosActualizados = {
      cedula: usuario.cedula, // Usar la cédula del usuario logueado
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim()
    };

    console.log("Datos a enviar:", datosActualizados); // Para debug

    try {
      const res = await fetch("http://localhost:4000/api/usuario/perfil", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosActualizados),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar perfil");
      }

      const data = await res.json();
      
      console.log("Respuesta del servidor:", data); // Para debug
      
      // Actualizar localStorage con los nuevos datos
      const usuarioActualizado = {
        ...usuario,
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        direccion: data.usuario.direccion,
        ciudad: data.usuario.ciudad
      };
      localStorage.setItem('usuarioInfo', JSON.stringify(usuarioActualizado));

      setMensaje("✅ Perfil actualizado exitosamente");
      
    } catch (error) {
      console.error("Error:", error);
      setMensaje(`❌ ${error.message || "No se pudo actualizar el perfil"}`);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    navigate("/");
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
          <h1 id="form-title">Actualizar Perfil</h1>

          {mensaje && (
            <div
              className={`mensaje ${mensaje.includes("✅") ? "exito" : "error"}`}
            >
              {mensaje}
            </div>
          )}

          {cargando && (
            <div className="cargando">
              Cargando datos del perfil...
            </div>
          )}

          <form id="actualizar-form" onSubmit={handleSubmit}>
            <div className="campos-grid">
              {/* Campos EDITABLES */}
              <div className="form-group">
                <label htmlFor="nombre">Nombre: *</label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={cargando}
                  placeholder="Ingresa tu nombre"
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido">Apellido: *</label>
                <input
                  type="text"
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  disabled={cargando}
                  placeholder="Ingresa tu apellido"
                />
              </div>

              <div className="form-group direccion-completa">
                <label htmlFor="direccion">Dirección:</label>
                <input
                  type="text"
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={cargando}
                  placeholder="Ingresa tu dirección completa"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ciudad">Ciudad:</label>
                <input
                  type="text"
                  id="ciudad"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  disabled={cargando}
                  placeholder="Ciudad de residencia"
                />
              </div>

              {/* Campos BLOQUEADOS (solo lectura) */}
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  readOnly
                  className="campo-bloqueado"
                  placeholder={cargando ? "Cargando..." : "Email no disponible"}
                />
                <small className="texto-ayuda">El email no se puede modificar</small>
              </div>

              <div className="form-group">
                <label htmlFor="cedula">Cédula:</label>
                <input
                  type="text"
                  id="cedula"
                  value={cedula}
                  readOnly
                  className="campo-bloqueado"
                />
                <small className="texto-ayuda">La cédula no se puede modificar</small>
              </div>
            </div>

            <div className="botones-accion">
              <button 
                type="submit" 
                id="btn-actualizar"
                disabled={cargando}
              >
                {cargando ? "Actualizando..." : "Actualizar Perfil"}
              </button>
              
              <button 
                type="button" 
                id="btn-cancelar"
                onClick={handleCancelar}
                disabled={cargando}
              >
                Cancelar
              </button>
            </div>

            <div className="info-ayuda">
              <small>* Campos obligatorios</small>
              <br />
              <small>Puedes editar tu nombre, apellido, dirección y ciudad</small>
            </div>
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

export default ActualizarPerfil;