import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import Hero from "./components/Hero.jsx"

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<Hero />
	</StrictMode>
)
