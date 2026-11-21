import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/400-italic.css";
import "@fontsource/bodoni-moda/500.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "lenis/dist/lenis.css";
import "./styles.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
