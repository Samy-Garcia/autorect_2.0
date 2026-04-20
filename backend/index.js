import app from "./app.js";
import "./database.js";

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Servidor en el puerto ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Puerto ${port} ya está en uso. Por favor, elige otro puerto.`);
      return;
    }

    console.error("Error del servidor:", error);
  });
}

// Ejecuta el servidor con el puerto configurado.
const port = Number(process.env.PORT) || 3000;
startServer(port);

process.on("unhandledRejection", (reason) => {
  console.error("Rechazo no manejado:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error);
});