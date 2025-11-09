import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import PanelAdmin from "./pages/PanelAdmin"; 
import ActualizarDatos from "./pages/ActualizarDatos";
import FormaEntrega from "./pages/Checkout/FormaEntrega";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/ajustes-de-cuenta" element={<ActualizarDatos />} />
        <Route path="/reset-password/:token" element={<RestablecerContrasena />} />
        <Route path="/checkout/forma-entrega" element={<FormaEntrega />} />
      </Routes>
    </Router>
  );
}

export default App;
