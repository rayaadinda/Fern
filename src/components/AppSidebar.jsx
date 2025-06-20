import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { UserButton, useUser, SignedIn, SignedOut } from "@clerk/clerk-react"
import { Plus, MessageSquare } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PanelLeft } from "lucide-react"

export default function AppSidebar() {
	const { user } = useUser()

	// Placeholder for chat history
	const chatHistory = [
		{ id: 1, title: "Summary of Q3 Earnings Report" },
		{ id: 2, title: "Analysis of Competitor A" },
		{ id: 3, title: "Key points from meeting" },
	]

	return (
		<>
			<header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 backdrop-blur-sm px-4 lg:hidden">
				<SidebarTrigger>
					<PanelLeft />
				</SidebarTrigger>
			</header>
		<Sidebar collapsible="icon">
			<SidebarHeader className="flex items-center justify-between p-2">
				<Button variant="outline" className="w-full justify-start group-data-[state=collapsed]:w-auto group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2">
					<Plus className="mr-2 h-4 w-4" />
					<span className="group-data-[state=collapsed]:hidden">New Chat</span>
				</Button>
			</SidebarHeader>
			<SidebarContent>
				<SidebarMenu>
					<SidebarMenuItem className="p-2 font-semibold text-sm group-data-[state=collapsed]:p-0 group-data-[state=collapsed]:text-center group-data-[state=collapsed]:text-xs">
						<span className="group-data-[state=collapsed]:hidden">History</span>
					</SidebarMenuItem>
					<SidebarMenuItem>
						{chatHistory.map(chat => (
							<Button variant="ghost" key={chat.id} className="w-full justify-start group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2">
								<MessageSquare className="mr-2 h-4 w-4" />
								<span className="group-data-[state=collapsed]:hidden truncate">{chat.title}</span>
							</Button>
						))}
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarContent>
			<Separator />
			<SidebarFooter>
				<SignedIn>
					<div className="flex items-center gap-2 p-2 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-0">
						<UserButton afterSignOutUrl="/sign-in" />
						<div className="flex flex-col group-data-[state=collapsed]:hidden">
							<span className="text-sm font-semibold">{user?.fullName}</span>
							<span className="text-xs text-muted-foreground">
								{user?.primaryEmailAddress.emailAddress}
							</span>
						</div>
					</div>
				</SignedIn>
				<SignedOut>
					<div className="p-2 group-data-[state=collapsed]:hidden">
						<Button asChild>
							<a href="/sign-in">Sign In</a>
						</Button>
					</div>
				</SignedOut>
			</SidebarFooter>
			</Sidebar>
		</>
	)
} 