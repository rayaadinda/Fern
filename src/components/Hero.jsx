import { Button } from "./ui/button"
import logo from "../assets/logo.svg"
import Aurora from "./ui/Aurora"
import DocumentUpload from "./DocumentUpload"
import { useState } from "react"

export default function Hero() {
	const [showUpload, setShowUpload] = useState(false)

	return (
		<div className="min-h-screen bg-background relative">
			<nav className="flex items-center justify-between px-12 py-4 relative z-10">
				<div className="flex items-center gap-2">
					<img src={logo} alt="logo" className="w-5 h-5" />
					<span className="text-2xl text-white font-bold">Fern</span>
				</div>
				<div className="flex items-center gap-4">
					<Button variant="ghost" className="text-sm text-white">
						Privacy
					</Button>
					<Button variant="default" className="bg-[#1E1E1E] text-white">
						About us
					</Button>
				</div>
			</nav>

			<main className="container mx-auto px-12 py-16 relative z-10">
				{!showUpload ? (
					<div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
						<div className="flex flex-col justify-center space-y-8">
							<h1 className="text-8xl font-semibold leading-tight">
								We summarize long PDF in seconds{" "}
							</h1>
							<div className="flex gap-4">
								<Button
									variant="default"
									className="bg-[#1E1E1E]"
									onClick={() => setShowUpload(true)}
								>
									Try now!
								</Button>
								<Button variant="outline">Sign Up</Button>
							</div>
						</div>
					</div>
				) : (
					<DocumentUpload />
				)}
			</main>

			{/* Aurora Background */}
			<div className="fixed inset-0 z-0">
				<Aurora
					colorStops={["#4C3AE3", "#7B5AFF", "#B4ABFF"]}
					amplitude={1.5}
					blend={0.8}
				/>
			</div>
		</div>
	)
}
