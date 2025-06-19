import { Button } from "@/components/ui/button"
import logo from "@/assets/logo.svg"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

const words = ["We", "summarize", "long", "PDF", "in", "seconds"]

export default function Home() {
	const navigate = useNavigate()

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

			<nav className="flex items-center justify-between px-12 py-4 relative z-10">
				<motion.div 
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5 }}
					className="flex items-center gap-2"
				>
					<img src={logo} alt="logo" className="w-5 h-5" />
					<span className="text-2xl text-white font-bold">Fern</span>
				</motion.div>
				<motion.div 
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5 }}
					className="flex items-center gap-4"
				>
					<Button variant="ghost" className="text-sm text-white">Privacy</Button>
					<Button variant="default" className="bg-[#1E1E1E] text-white">About us</Button>
				</motion.div>
			</nav>

			<main className="container mx-auto px-12 py-16 relative z-10">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-2 mb-16">
					<div className="flex flex-col justify-center space-y-8">
						<div className="flex flex-wrap gap-4">
							{words.map((word, i) => (
								<motion.span
									key={word}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.5,
										delay: i * 0.1,
										ease: [0.2, 0.65, 0.3, 0.9],
									}}
									className="text-7xl md:text-8xl font-semibold text-white"
								>
									{word}{" "}
								</motion.span>
							))}
						</div>
						<div className="flex gap-4">
							<Button
								variant="default"
								className="bg-[#1E1E1E]"
								onClick={() => navigate('/chat')}
							>
								Try now!
							</Button>
							<Button variant="outline">Sign Up</Button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Card 1 */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="bg-[#1E1E1E] rounded-xl shadow-lg p-8 flex flex-col justify-between min-h-[340px]"
					>
						<div>
							<h2 className="text-white text-2xl font-bold mb-2">Proven Research Rapid Results</h2>
							<p className="text-gray-200 mb-6">Complex questions? Solved. Get expertly sourced answers across law, tax, and compliance—backed by citations that speak volumes.</p>
						</div>
						<Button className="bg-white text-black rounded-lg px-4 py-2 font-semibold w-fit">Learn more</Button>
					</motion.div>
					{/* Card 2 */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
						className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between min-h-[340px]"
					>
						<h2 className="text-black text-2xl font-bold mb-4">Aligned With Your Workflow</h2>
						<p className="text-gray-700 mb-6">Effortlessly hand off complex, domain specific tasks with simple natural language commands.</p>
						<Button 
							className="bg-black text-white rounded-lg px-4 py-2 font-semibold w-fit" 
							onClick={() => navigate('/chat')}
						>
							Try Fern Now
						</Button>
					</motion.div>
					{/* Card 3 */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.6 }}
						className="bg-[#1E1E1E] rounded-xl shadow-lg p-8 flex flex-col justify-between min-h-[340px]"
					>
						<h2 className="text-white text-2xl font-bold mb-2">Privatised & Project-Ready</h2>
						<p className="text-gray-200 mb-6">Turn Document Chaos Into AI-Powered Clarity.</p>
					</motion.div>
				</div>
			</main>

			<motion.footer 
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.8 }}
				className="w-full bg-neutral-100 py-8 mt-12"
			>
				<div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
					<div className="text-neutral-500 text-sm">&copy; {new Date().getFullYear()} <a href="https://www.rayaadinda.site/" target="_blank" rel="noopener noreferrer" className="underline">Raya Adinda</a>. All rights reserved.</div>
					<div className="flex gap-4 mt-4 md:mt-0">
						<a href="#" className="text-neutral-500 hover:text-black transition">Privacy Policy</a>
						<a href="#" className="text-neutral-500 hover:text-black transition">Terms of Service</a>
					</div>
				</div>
			</motion.footer>
		</div>
	)
} 