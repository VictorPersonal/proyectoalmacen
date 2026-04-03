import { useState, useEffect } from "react";
import "../styles/pages/ActualizarDatos.css";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import SimpleHeader from "../components/SimpleHeader";
import SimpleFooter from "../components/SimpleFooter";

function ActualizarPerfil() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState(""); // 👈 NUEVO ESTADO
  const [mensaje, setMensaje] = useState("");
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
      title: '¿Estás seguro?',
      text: "¿Quieres actualizar tu información personal?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D84040',
      cancelButtonColor: '#666',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    });
  };

  // 🔹 Cargar perfil desde backend (usando cookie con token)
  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      try {
        const res = await fetch("http://localhost:4000/api/auth/usuario/perfil", {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          mostrarError("Sesión expirada o no autorizada. Serás redirigido al login...");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        if (!res.ok) throw new Error("Error al obtener datos del perfil");

        const data = await res.json();

        setNombre(data.nombre || "");
        setApellido(data.apellido || "");
        setEmail(data.email || "");
        setCedula(data.cedula || "");
        setDireccion(data.direccion || "");
        setCiudad(data.ciudad || "");
        setTelefono(data.telefono || ""); // 👈 CARGAR TELÉFONO

        // Mostrar mensaje de éxito al cargar
        Swal.fire({
          icon: 'success',
          title: 'Perfil cargado',
          text: 'Tus datos se han cargado correctamente',
          confirmButtonColor: '#D84040',
          timer: 2000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error("❌ Error al cargar el perfil:", error);
        mostrarError("Error al cargar los datos del perfil");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [navigate]);


  // 🔹 Enviar datos actualizados al backend
  const handleSubmit = async (e) => {
    e.preventDefault();

///----VALIDACIONES ----///

    // Validar campos obligatorios
    if (!nombre.trim() || !apellido.trim() || !direccion.trim() || !ciudad.trim()) {
      mostrarError("Por favor, completa todos los campos obligatorios");
      return;
    }



    // Regex para nombres y textos con espacios
    const regexTexto = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    if (!regexTexto.test(nombre.trim())) {
      mostrarError("El nombre solo puede contener letras y espacios");
      return;
    }

    if (!regexTexto.test(apellido.trim())) {
      mostrarError("El apellido solo puede contener letras y espacios");
      return;
    }

    if (!regexTexto.test(ciudad.trim())) {
      mostrarError("La ciudad solo puede contener letras y espacios");
      return;
    }





    // Validar dirección: letras, números, espacios, guiones, puntos, comas y #
    const regexDireccion = /^[A-Za-z0-9\s\-\#\.,]+$/;

    if (!regexDireccion.test(direccion.trim())) {
      mostrarError("La dirección contiene caracteres no válidos. Usa solo letras, números, espacios, guiones, #, comas o puntos.");
      return;
    }


    // Validar teléfono (opcional pero con formato si se ingresa)
    if (telefono && !/^\d{7,15}$/.test(telefono.replace(/\s/g, ''))) {
      mostrarError("Por favor, ingresa un número de teléfono válido (solo números, 7-15 dígitos)");
      return;
    }

    // Mostrar confirmación antes de actualizar
    const confirmacion = await mostrarConfirmacion();
    if (!confirmacion.isConfirmed) {
      return;
    }

    setCargando(true);
    setMensaje("");

    const datosActualizados = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      telefono: telefono.trim(), // 👈 ENVIAR TELÉFONO
    };

    try {
      const res = await fetch("http://localhost:4000/api/auth/usuario/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(datosActualizados),
      });

      if (res.status === 401 || res.status === 403) {
        mostrarError("Sesión expirada o no autorizada. Serás redirigido al login...");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar perfil");
      }

      const data = await res.json();

      // Actualizar estado local
      setNombre(data.usuario.nombre || "");
      setApellido(data.usuario.apellido || "");
      setDireccion(data.usuario.direccion || "");
      setCiudad(data.usuario.ciudad || "");
      setTelefono(data.usuario.telefono || ""); // 👈 ACTUALIZAR TELÉFONO

      // Mostrar mensaje de éxito
      mostrarExito("Tu perfil ha sido actualizado exitosamente");

    } catch (error) {
      console.error("❌ Error al actualizar:", error);
      mostrarError(error.message || "No se pudo actualizar el perfil");
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    Swal.fire({
      title: '¿Cancelar cambios?',
      text: "Los cambios no guardados se perderán",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D84040',
      cancelButtonColor: '#666',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Seguir editando'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
      }
    });
  };

  return (
    <>
      <SimpleHeader />

      <main className="actualizar-container">
        <div className="actualizar-form-wrapper">
          <h1 className="actualizar-form-title">Actualizar Perfil</h1>

          {mensaje && (
            <div
              className={`actualizar-mensaje ${mensaje.includes("✅") ? "actualizar-mensaje-exito" : "actualizar-mensaje-error"}`}
            >
              {mensaje}
            </div>
          )}

          {cargando && (
            <div className="actualizar-cargando">
              <div className="spinner"></div>
              Cargando datos del perfil...
            </div>
          )}

          <form className="actualizar-form" onSubmit={handleSubmit}>
            <div className="actualizar-campos-grid">
              {/* Campos EDITABLES */}
              <div className="actualizar-form-group">
                <label htmlFor="actualizar-nombre">Nombre*:</label>
                <input
                  type="text"
                  id="actualizar-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={cargando}
                  placeholder="Ingresa tu nombre"
                />
              </div>

              <div className="actualizar-form-group">
                <label htmlFor="actualizar-apellido">Apellido*:</label>
                <input
                  type="text"
                  id="actualizar-apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  disabled={cargando}
                  placeholder="Ingresa tu apellido"
                />
              </div>

              <div className="actualizar-form-group actualizar-direccion-completa">
                <label htmlFor="actualizar-direccion">Dirección*:</label>
                <input
                  type="text"
                  id="actualizar-direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={cargando}
                  placeholder="Ingresa tu dirección completa"
                  required
                />
              </div>

              {/* 👇 NUEVA FILA: Ciudad y Teléfono */}
              <div className="actualizar-form-group">
                <label htmlFor="actualizar-ciudad">Ciudad*:</label>
                <input
                  type="text"
                  id="actualizar-ciudad"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  disabled={cargando}
                  placeholder="Ciudad de residencia"
                  required
                />
              </div>

              <div className="actualizar-form-group">
                <label htmlFor="actualizar-telefono">Teléfono:</label>
                <input
                  type="tel"
                  id="actualizar-telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  disabled={cargando}
                  placeholder="Ej: 3123456789"
                  pattern="[0-9]{7,15}"
                  title="Solo números, 7-15 dígitos"
                />
                <small className="actualizar-texto-ayuda">
                  Solo números
                </small>
              </div>

              {/* 👇 NUEVA FILA: Cédula y Email (BLOQUEADOS) */}
              <div className="actualizar-form-group">
                <label htmlFor="actualizar-cedula">Cédula:</label>
                <input
                  type="text"
                  id="actualizar-cedula"
                  value={cedula}
                  readOnly
                  className="actualizar-campo-bloqueado"
                />
                <small className="actualizar-texto-ayuda">
                  La cédula no se puede modificar
                </small>
              </div>

              <div className="actualizar-form-group">
                <label htmlFor="actualizar-email">Email:</label>
                <input
                  type="email"
                  id="actualizar-email"
                  value={email}
                  readOnly
                  className="actualizar-campo-bloqueado"
                  placeholder={cargando ? "Cargando..." : "Email no disponible"}
                />
                <small className="actualizar-texto-ayuda">
                  El email no se puede modificar
                </small>
              </div>
            </div>

            <div className="actualizar-botones-accion">
              <button type="submit" className="actualizar-btn-actualizar" disabled={cargando}>
                {cargando ? (
                  <>
                    <div className="spinner-small"></div>
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Perfil"
                )}
              </button>

              <button
                type="button"
                className="actualizar-btn-cancelar"
                onClick={handleCancelar}
                disabled={cargando}
              >
                Cancelar
              </button>
            </div>

            <div className="actualizar-info-ayuda">
              <small>* Campos obligatorios</small>
              <br />
              <small>Puedes editar tu nombre, apellido, dirección, ciudad y teléfono</small>
            </div>
          </form>
        </div>
      </main>

      <SimpleFooter />
    </>
  );
}

export default ActualizarPerfil;