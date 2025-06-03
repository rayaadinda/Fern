"use client"

import * as React from "react"
import { toast, Toaster } from "sonner"
import { Upload, X, Send, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadItemProgress,
	FileUploadList,
	FileUploadTrigger,
} from "@/components/ui/file-upload"
import { Worker, Viewer } from "@react-pdf-viewer/core"
import "@react-pdf-viewer/core/lib/styles/index.css"
import * as pdfjsLib from "pdfjs-dist/build/pdf"
import "pdfjs-dist/build/pdf.worker.entry"

const MAX_FILE_SIZE = 20 * 1024 * 1024

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_MODEL = "deepseek/deepseek-chat-v3-0324:free"
const OPENROUTER_API_KEY =
	"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"

function formatSummaryParagraphs(text) {
	return text
		.replace(/(Objective:)/g, "\n$1")
		.replace(/(Methodology:)/g, "\n$1")
		.replace(/(Key Features:)/g, "\n$1")
		.replace(/(Findings:)/g, "\n$1")
		.replace(/\n{2,}/g, "\n\n")
		.trim()
}

export default function DocumentUpload() {
	const [files, setFiles] = React.useState([])
	const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState(null)
	const [imagePreviewUrl, setImagePreviewUrl] = React.useState(null)
	const [pdfText, setPdfText] = React.useState("")
	const [message, setMessage] = React.useState("")
	const [messages, setMessages] = React.useState([])
	const [isLoading, setIsLoading] = React.useState(false)
	const [imageAnalysis, setImageAnalysis] = React.useState(null)

	const chatEndRef = React.useRef(null)

	const scrollToBottom = () => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	React.useEffect(() => {
		scrollToBottom()
	}, [messages, isLoading])

	const onFileReject = React.useCallback((file, message) => {
		toast.error(message, {
			description: `"${file.name}" has been rejected`,
		})
	}, [])

	const onAccept = async (files) => {
		setFiles(files)
		setImageAnalysis(null)
		setPdfPreviewUrl(null)
		setImagePreviewUrl(null)
		setPdfText("")

		const file = files[0]
		if (!file) return

		if (file.type === "application/pdf") {
			const url = URL.createObjectURL(file)
			setPdfPreviewUrl(url)
			const text = await extractPdfText(file)
			setPdfText(text)
		} else if (file.type.startsWith("image/")) {
			const url = URL.createObjectURL(file)
			setImagePreviewUrl(url)
			await analyzeImage(file)
		}
	}

	const extractPdfText = async (file) => {
		const arrayBuffer = await file.arrayBuffer()
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
		let text = ""
		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i)
			const content = await page.getTextContent()
			text += content.items.map((item) => item.str).join(" ") + "\n"
		}
		return text
	}

	const analyzeImage = async (file) => {
		setIsLoading(true)
		try {
			const formData = new FormData()
			formData.append("file", file)

			const response = await fetch("http://localhost:5000/api/analyze-image", {
				method: "POST",
				body: formData,
			})

			if (!response.ok) {
				throw new Error("Failed to analyze image")
			}

			const data = await response.json()
			setImageAnalysis(data)

			// Add image analysis results to messages
			const analysisMessage = formatImageAnalysisMessage(data)
			setMessages((prev) => [...prev, { type: "bot", text: analysisMessage }])
		} catch (err) {
			toast.error("Failed to analyze image")
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const formatImageAnalysisMessage = (analysis) => {
		const sections = []

		if (analysis.labels?.length > 0) {
			sections.push(`Labels Detected:\n${analysis.labels.join(", ")}`)
		}

		if (analysis.text) {
			sections.push(`Text Detected:\n${analysis.text}`)
		}

		if (analysis.objects?.length > 0) {
			const objects = analysis.objects
				.map(
					(obj) =>
						`${obj.name} (${Math.round(obj.confidence * 100)}% confidence)`
				)
				.join("\n")
			sections.push(`Objects Detected:\n${objects}`)
		}

		if (analysis.faces?.length > 0) {
			const faces = analysis.faces
				.map((face, index) => {
					const emotions = []
					if (face.joy === "VERY_LIKELY") emotions.push("Joy 😊")
					if (face.sorrow === "VERY_LIKELY") emotions.push("Sorrow 😢")
					if (face.anger === "VERY_LIKELY") emotions.push("Anger 😠")
					if (face.surprise === "VERY_LIKELY") emotions.push("Surprise 😮")
					return `Face ${index + 1}: ${emotions.join(", ") || "Neutral"}`
				})
				.join("\n")
			sections.push(`Faces Detected:\n${faces}`)
		}

		if (analysis.safe_search) {
			const safeSearch = Object.entries(analysis.safe_search)
				.map(
					([key, value]) =>
						`${
							key.charAt(0).toUpperCase() + key.slice(1)
						}: ${value.toLowerCase()}`
				)
				.join("\n")
			sections.push(`Content Safety Analysis:\n${safeSearch}`)
		}

		return sections.join("\n\n")
	}

	const handleSend = async () => {
		if (!message.trim()) return
		setIsLoading(true)

		const userMessage = message
		setMessages((prev) => [...prev, { type: "user", text: userMessage }])
		setMessage("")

		try {
			let prompt = userMessage

			if (userMessage.trim().toLowerCase() === "summarize" && pdfText) {
				const firstLine = pdfText.split("\n")[0].trim()
				const pdfTitle = firstLine.length > 0 ? firstLine : "Dokumen PDF"
				prompt = `Buatkan ringkasan dari konten PDF berikut dalam bahasa Indonesia, dengan format berikut (tanpa bullet, tanpa tanda bintang, dan tanpa markdown):

Summary of "${pdfTitle}"

Pisahkan setiap bagian dengan satu baris kosong agar mudah dibaca. Setiap bagian harus menjadi paragraf yang jelas.

Konten PDF:
${pdfText.slice(0, 2000)}
`
			}

			const response = await fetch(OPENROUTER_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
				},
				body: JSON.stringify({
					model: OPENROUTER_MODEL,
					messages: [
						{
							role: "system",
							content:
								"Anda adalah asisten AI yang sangat terstruktur. Selalu jawab dalam bahasa Indonesia, tanpa bullet, tanpa tanda bintang, dan tanpa markdown. Pisahkan setiap bagian dengan satu baris kosong agar mudah dibaca.",
						},
						{ role: "user", content: prompt },
					],
				}),
			})

			const data = await response.json()

			if (data.error) {
				setMessages((prev) => [
					...prev,
					{ type: "bot", text: data.error.message || "API Error" },
				])
			} else {
				const rawResponse = data.choices?.[0]?.message?.content || "No response"
				const formatted = formatSummaryParagraphs(rawResponse)
				setMessages((prev) => [...prev, { type: "bot", text: formatted }])
			}
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ type: "bot", text: "Error connecting to OpenRouter API" },
			])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<>
			<div className="w-full max-w-xl mx-auto p-4">
				<FileUpload
					accept=".pdf,image/*"
					maxFiles={1}
					maxSize={MAX_FILE_SIZE}
					className="w-full"
					onAccept={onAccept}
					onFileReject={onFileReject}
				>
					<FileUploadDropzone className="border-dashed border-2 border-gray-600 bg-black/95 hover:bg-black/90">
						<div className="flex flex-col items-center gap-2 text-gray-300">
							<Upload className="size-6" />
							<p className="text-sm">Drag & drop files here</p>
							<p className="text-xs text-gray-500">PDF documents or images</p>
							<FileUploadTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="mt-2 text-white bg-black/95"
								>
									Browse files
								</Button>
							</FileUploadTrigger>
						</div>
					</FileUploadDropzone>

					<FileUploadList className="mt-4">
						{files.map((file, index) => (
							<FileUploadItem
								key={index}
								value={file}
								className="bg-black/95 border border-gray-800 text-gray-300"
							>
								<div className="flex w-full items-center gap-2">
									<FileUploadItemPreview className="bg-gray-800/50" />
									<FileUploadItemMetadata />
									<FileUploadItemDelete asChild>
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-gray-400 hover:text-white hover:bg-gray-800"
										>
											<X className="size-4" />
										</Button>
									</FileUploadItemDelete>
								</div>
							</FileUploadItem>
						))}
					</FileUploadList>
				</FileUpload>

				{/* Preview Section */}
				{(pdfPreviewUrl || imagePreviewUrl) && (
					<div
						className="border border-gray-700 mt-4 rounded-md overflow-hidden"
						style={{ height: "600px" }}
					>
						{pdfPreviewUrl && (
							<Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
								<Viewer fileUrl={pdfPreviewUrl} />
							</Worker>
						)}
						{imagePreviewUrl && (
							<img
								src={imagePreviewUrl}
								alt="Preview"
								className="w-full h-full object-contain"
							/>
						)}
					</div>
				)}
			</div>

			<div className="w-full max-w-xl mx-auto flex flex-col gap-4 px-4 pb-4">
				<div className="flex flex-col gap-6">
					{messages.map((msg, idx) => (
						<div
							key={idx}
							className={`p-6 rounded-2xl shadow-lg transition-all duration-500 ${
								msg.type === "user" ? "bg-[#272727]" : "bg-[#1E1E1E]"
							} animate-fadeIn`}
						>
							{msg.text.split(/\n\s*\n/).map((para, pidx) => (
								<p
									key={pidx}
									className="text-gray-300 text-base leading-relaxed"
								>
									{para.trim()}
								</p>
							))}
						</div>
					))}

					{isLoading && (
						<div className="animate-pulse p-6 rounded-2xl shadow-lg bg-[#1E1E1E]">
							<div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
							<div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
							<div className="h-4 bg-gray-700 rounded w-2/3"></div>
						</div>
					)}

					<div ref={chatEndRef} />
				</div>

				{/* Input Area */}
				<div className="relative flex items-center">
					<div className="flex-1 rounded-xl border border-gray-800 bg-black/95 p-2">
						<div className="flex items-center gap-2">
							<button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
								<Plus className="h-5 w-5 text-gray-400" />
							</button>

							<input
								type="text"
								placeholder={
									pdfText
										? "Ask about the document or type 'summarize'"
										: "View analysis results above"
								}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								className="flex-1 border-0 bg-transparent text-gray-300 placeholder-gray-500 outline-none"
								onKeyDown={(e) => e.key === "Enter" && handleSend()}
								disabled={!pdfText}
							/>

							<div className="flex items-center gap-2 border-l border-gray-700 pl-2">
								<button
									className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50"
									disabled={!message.trim() || isLoading || !pdfText}
									onClick={handleSend}
								>
									<Send
										className={`h-5 w-5 ${
											message.trim() && pdfText
												? "text-gray-300"
												: "text-gray-600"
										}`}
									/>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Toaster />
		</>
	)
}
