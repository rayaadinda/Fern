import { motion } from "framer-motion"
import DocumentUpload from "@/components/DocumentUpload"
import { Link } from "react-router-dom"
import logo from "@/assets/logo.svg"
import { Button } from "@/components/ui/button"

export default function Chat() {
	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Radiant Gradient Background */}
			<div className="fixed inset-0 -z-10 w-full h-full">
				<div
					className="w-full h-full"
					style={{
						background:
							"radial-gradient(ellipse 80% 60% at 50% 20%, #a5b4fc 0%, #6366f1 40%, #f1f5f9 100%)",
						opacity: 1,
						filter: "blur(0px)",
					}}
				/>
			</div>

			<motion.nav 
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex items-center justify-between px-12 py-4 relative z-10"
			>
				<Link to="/" className="flex items-center gap-2">
					<img src={logo} alt="logo" className="w-5 h-5" />
					<span className="text-2xl text-white font-bold">Fern</span>
				</Link>
				<div className="flex items-center gap-4">
					<Button variant="ghost" className="text-sm text-white">Privacy</Button>
					<Button variant="default" className="bg-[#1E1E1E] text-white">About us</Button>
				</div>
			</motion.nav>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<DocumentUpload />
			</motion.div>
		</div>
	)
} 