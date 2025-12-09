import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import PanelAdmin from "./pages/PanelAdmin"; 
import ActualizarDatos from "./pages/ActualizarDatos";
import FormaEntrega from "./pages/Checkout/FormaEntrega";
import Pago from "./pages/Checkout/Pago";
import Favoritos from "./pages/Favorito";
import Categorias from "./pages/Categoriaspages";
import TerminosYCondiciones from "./pages/Terminosycondiciones";
import PagoExitoso from "./pages/Checkout/PagoExitoso";
import HistoriaDulceHogar from "./pages/HistoriaDulceHogar";
import ModificarDireccion from "./pages/Checkout/ModificarDireccion";
import PreguntasFrecuentes from "./pages/PreguntasFrecuentes";
import DescripcionProducto from "./components/DescripcionProducto";
import Promociones from "./pages/Promociones";
import ConsejodeSeguridad from "./pages/ConsejodeSeguridad";




function AppWrapper() {
  const location = useLocation();
  const state = location.state;

  return (
    <>
      {/* Rutas principales */}
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/" element={<Home />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/login/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/ajustes-de-cuenta" element={<ActualizarDatos />} />
        <Route path="/reset-password/:token" element={<RestablecerContrasena />} />
        <Route path="/checkout/forma-entrega" element={<FormaEntrega />} />
        <Route path="/checkout/forma-entrega/pago" element={<Pago />} />
        <Route path="/terminos-y-condiciones" element={<TerminosYCondiciones />} />
        <Route path="/checkout/forma-entrega/pago/exitoso" element={<PagoExitoso />} />
        <Route path="/Acerca-de/Dulce-Hogar" element={<HistoriaDulceHogar />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/modificar-direccion" element={<ModificarDireccion />} />
        <Route path="/promociones" element={<Promociones />} />
        <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />
        <Route path="/registro/terminosycondiciones" element={<TerminosYCondiciones />} />
        <Route path="/Consejo-de-Seguridad" element={<ConsejodeSeguridad />} />
        {/* ✅ AGREGAR ESTA RUTA TAMBIÉN EN LAS PRINCIPALES */}
        <Route path="/producto/:id" element={<DescripcionProducto />} />
      </Routes>

      {/* Modal superpuesto */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/producto/:id" element={<DescripcionProducto />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
      <Router>
        <AppWrapper />
      </Router>
  );
}

export default App;