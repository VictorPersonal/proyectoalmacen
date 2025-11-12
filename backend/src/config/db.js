// db.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ Verificar conexión
(async () => {
  const { data, error } = await supabase.from("usuario").select("count");
  if (error) {
    console.error("🔴 Error al conectar a Supabase:", error.message);
  } else {
    console.log("🟢 Conectado correctamente a Supabase");
  }
})();
