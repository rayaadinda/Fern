import { Button } from "@/components/ui/button"
import logo from "@/assets/logo.svg"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"

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
							"radial-gradient(ellipse 80% 60% at 50% 20%, #38bdf8 0%, #93c5fd 40%, #f1f5f9 100%)",
						opacity: 1,
						filter: "blur(40px)",
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
					<SignedIn>
						<UserButton afterSignOutUrl="/" />
					</SignedIn>
					<SignedOut>
						<Button variant="ghost" className="text-sm text-white" onClick={() => navigate('/sign-in')}>
							Sign In
						</Button>
						<Button variant="default" className="bg-[#1E1E1E] text-white" onClick={() => navigate('/sign-up')}>
							Sign Up
						</Button>
					</SignedOut>
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
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="flex gap-4"
						>
							<Button
								variant="default"
								className="bg-[#1E1E1E]"
								onClick={() => navigate('/chat')}
							>
								Try now!
							</Button>
						</motion.div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="bg-[#1E1E1E] rounded-xl shadow-lg p-8 flex flex-col justify-between min-h-[340px]"
					>
						<div>
							<h2 className="text-white text-2xl font-bold mb-4">Instant Clarity, Not Clutter</h2>
							<p className="text-gray-300 text-base leading-relaxed">Transform dense PDFs and images into concise, actionable summaries. Ask questions and get intelligent answers in seconds.</p>
						</div>
						<Button className="bg-white text-black rounded-lg px-4 py-2 mt-6 font-semibold w-fit">Learn more</Button>
					</motion.div>
					
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
						className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between min-h-[340px]"
					>
						<div>
							<h2 className="text-black text-2xl font-bold mb-4">Seamlessly Integrated</h2>
							<p className="text-gray-600 text-base leading-relaxed">Just drag, drop, and start your conversation. Fern fits right into your workflow, no complicated setup required.</p>
						</div>
						<Button 
							className="bg-black text-white rounded-lg px-4 py-2 mt-6 font-semibold w-fit" 
							onClick={() => navigate('/chat')}
						>
							Try Fern Now
						</Button>
					</motion.div>
				
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.6 }}
						className="bg-[#1E1E1E] rounded-xl shadow-lg p-8 flex flex-col justify-between min-h-[340px]"
					>
						<div>
							<h2 className="text-white text-2xl font-bold mb-4">Powered by OpenRouter</h2>
							<p className="text-gray-300 text-base leading-relaxed">Leveraging the best open-source models via the OpenRouter API for state-of-the-art analysis, while keeping your data private and secure.</p>
						</div>
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
					<div className="text-neutral-500 text-sm">&copy; {new Date().getFullYear()} <a href="https://www.rayaadinda.site/" target="_blank" rel="noopener noreferrer" className="underline hover:text-black transition">Raya Adinda</a>. All rights reserved.</div>
					<div className="flex gap-4 mt-4 md:mt-0">
						<a href="#" className="text-neutral-500 text-sm hover:text-black transition">Privacy Policy</a>
						<a href="#" className="text-neutral-500 text-sm hover:text-black transition">Terms of Service</a>
					</div>
				</div>
			</motion.footer>
		</div>
	)
} 