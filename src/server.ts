import app from "./app.js";

process.on("uncaughtException", (err) => {
    console.error("[CRITICAL ERROR] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL ERROR] Unhandled Rejection at:", promise, "reason:", reason);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


