import mongoose from "mongoose";
import { config } from "./config.js";

mongoose.connect(config.db.URI);

//Comprobar que todo funciona
const connection = mongoose.connection;

connection.once("open", () => {
  console.log("DB is connected");
});

connection.on("disconnected", (error) => {
  console.log("DB is disconnected" + error);
});

connection.on("error", (error) => {
  console.log("error found" + error);
});