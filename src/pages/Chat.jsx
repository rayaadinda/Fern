import { motion } from "framer-motion"
import DocumentUpload from "@/components/DocumentUpload"
import AppSidebar from "@/components/AppSidebar"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@clerk/clerk-react"
import { cn } from "@/lib/utils"

function ChatLayout() {
	const { open } = useSidebar()
	return (
		<main
			className={cn(
				"transition-all duration-300 ease-in-out",
				{
					"lg:ml-72": open,
					"lg:ml-14": !open,
				},
				"lg:bg-muted/50"
			)}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="p-4"
			>
				<DocumentUpload />
			</motion.div>
		</main>
	)
}

export default function Chat() {
	const { isLoaded, isSignedIn } = useAuth()

	return (
		<SidebarProvider>
			<div className="w-full max-w-screen-4xl mx-auto min-h-screen bg-background">
				{isLoaded && isSignedIn && <AppSidebar />}
				<ChatLayout />
			</div>
		</SidebarProvider>
	)
} 