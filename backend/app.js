import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import productsRoutes from "./src/routes/products.js";
import loginRoutes from "./src/routes/login.js";
import logoutRoutes from "./src/routes/logout.js";
import userRoutes from "./src/routes/users.js";
import registerUsersRoutes from "./src/routes/registerUsers.js";
import refreshRoutes from "./src/routes/refresh.js";


const app = express();

const allowedOrigins = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
].filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error("Origen no permitido por CORS"));
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Rutas
app.use("/api/login", loginRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/register", registerUsersRoutes);

export default app;