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
const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528-qwen3-8b:free"
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

function stripMarkdown(text) {
	return text
		.replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
		.replace(/\*([^*]+)\*/g, '$1')       // *italic*
		.replace(/`([^`]+)`/g, '$1')           // `code`
		.replace(/__([^_]+)__/g, '$1')         // __bold__
		.replace(/_([^_]+)_/g, '$1');          // _italic_
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
	const [conversationHistory, setConversationHistory] = React.useState([])

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
			const base64Image = await new Promise((resolve) => {
				const reader = new FileReader()
				reader.onloadend = () => resolve(reader.result.split(',')[1])
				reader.readAsDataURL(file)
			})

			const response = await fetch(OPENROUTER_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${OPENROUTER_API_KEY}`,
					"HTTP-Referer": window.location.href,
					"X-Title": "Fern Document Analyzer"
				},
				body: JSON.stringify({
					model: OPENROUTER_MODEL,
					messages: [
						{
							role: "system",
							content: "You are an expert image analyzer. Analyze the image and provide detailed information about its contents in Indonesian language. Structure the analysis into sections: Objects, Text (if any), and Overall Description."
						},
						{
							role: "user",
							content: [
								{
									type: "text",
									text: "Please analyze this image and provide a detailed description in Indonesian language."
								},
								{
									type: "image_url",
									image_url: {
										url: `data:image/jpeg;base64,${base64Image}`
									}
								}
							]
						}
					]
				})
			})

			if (!response.ok) {
				throw new Error("Failed to analyze image")
			}

			const data = await response.json()
			const analysisText = data.choices?.[0]?.message?.content || "Tidak dapat menganalisis gambar"
			
			setImageAnalysis({ text: analysisText })
			setMessages((prev) => [...prev, { type: "bot", text: analysisText }])
		} catch (err) {
			toast.error("Gagal menganalisis gambar")
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleSend = async () => {
		if (!message.trim()) return
		setIsLoading(true)

		const userMessage = message
		setMessages((prev) => [...prev, { type: "user", text: userMessage }])
		setMessage("")

		try {
			let prompt = userMessage
			let systemMessage = "Anda adalah asisten AI yang sangat terstruktur. Selalu jawab dalam bahasa Indonesia, tanpa bullet, tanpa tanda bintang, dan tanpa markdown. Pisahkan setiap bagian dengan satu baris kosong agar mudah dibaca."

			if (userMessage.trim().toLowerCase() === "summarize" && pdfText) {
				const firstLine = pdfText.split("\n")[0].trim()
				const pdfTitle = firstLine.length > 0 ? firstLine : "Dokumen PDF"
				prompt = `Buatkan ringkasan dari konten PDF berikut dalam bahasa Indonesia, dengan format berikut (tanpa bullet, tanpa tanda bintang, dan tanpa markdown):\n\nSummary of \"${pdfTitle}\"\n\nPisahkan setiap bagian dengan satu baris kosong agar mudah dibaca. Setiap bagian harus menjadi paragraf yang jelas.\n\nKonten PDF:\n${pdfText.slice(0, 2000)}\n`
				setConversationHistory([])
			} else if (pdfText) {
				systemMessage = `Anda adalah asisten AI yang sangat terstruktur yang sedang membantu pengguna memahami dokumen berikut:\n\n${pdfText.slice(0, 2000)}\n\nGunakan konteks dokumen di atas untuk menjawab pertanyaan pengguna. Selalu jawab dalam bahasa Indonesia, tanpa bullet, tanpa tanda bintang, dan tanpa markdown. Pisahkan setiap bagian dengan satu baris kosong agar mudah dibaca. Pastikan jawaban Anda relevan dengan konteks dokumen.`
			}

			const messagesArray = [
				{ role: "system", content: systemMessage },
				...conversationHistory,
				{ role: "user", content: prompt }
			]

			const response = await fetch(OPENROUTER_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${OPENROUTER_API_KEY}`,
					"HTTP-Referer": window.location.href,
					"X-Title": "Fern Document Analyzer"
				},
				body: JSON.stringify({
					model: OPENROUTER_MODEL,
					messages: messagesArray
				})
			})

			const data = await response.json()

			if (data.error) {
				setMessages((prev) => [
					...prev,
					{ type: "bot", text: data.error.message || "API Error" }
				])
			} else {
				const rawResponse = data.choices?.[0]?.message?.content || "No response"
				const formatted = formatSummaryParagraphs(stripMarkdown(rawResponse))
				setMessages((prev) => [...prev, { type: "bot", text: formatted }])

				setConversationHistory(prev => [
					...prev,
					{ role: "user", content: prompt },
					{ role: "assistant", content: rawResponse }
				])
			}
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ type: "bot", text: "Error connecting to OpenRouter API" }
			])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<>
			<div className="w-full max-w-4xl mx-auto p-4">
				<FileUpload
					accept=".pdf,image/*"
					maxFiles={1}
					maxSize={MAX_FILE_SIZE}
					className="w-full"
					onAccept={onAccept}
					onFileReject={onFileReject}
				>
					<FileUploadDropzone className=" bg-white">
						<div className="flex flex-col items-center gap-2 text-gray-300">
							<Upload className="size-6 text-black" />
							<p className="text-sm text-black">Drag & drop files here</p>
							<p className="text-xs text-black">PDF documents or images</p>
							<FileUploadTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="mt-2 text-white bg-[#1E1E1E]"
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
								className="bg-white border border-gray-800 text-black"
							>
								<div className="flex w-full items-center gap-2">
									<FileUploadItemPreview className="bg-gray-800/50" />
									<FileUploadItemMetadata />
									<FileUploadItemDelete asChild>
										<Button
											variant="ghost"
											size="icon"
											className="size-7 text-black hover:text-white hover:bg-gray-800"
										>
											<X className="size-4" />
										</Button>
									</FileUploadItemDelete>
								</div>
							</FileUploadItem>
						))}
					</FileUploadList>
				</FileUpload>

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

			<div className="w-full max-w-4xl mx-auto flex flex-col gap-4 px-4 pb-4">
				<div className="flex flex-col gap-6">
					{messages.map((msg, idx) => (
						<div
							key={idx}
							className={`p-6 rounded-xl shadow-lg transition-all duration-500 bg-white animate-fadeIn ${msg.type === "user" ? "text-right" : "text-left"}`}
						>
							{msg.text.split(/\n\s*\n/).map((para, pidx) => (
								<p
									key={pidx}
									className="text-black text-base leading-relaxed"
								>
									{para.trim()}
								</p>
							))}
						</div>
					))}

					{isLoading && (
						<div className="animate-pulse p-6 rounded-md shadow-lg bg-white">
							<div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
							<div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
							<div className="h-4 bg-gray-700 rounded w-2/3"></div>
						</div>
					)}

					<div ref={chatEndRef} />
				</div>

				<div className="relative flex items-center">
					<div className="flex-1 rounded-xl border border-gray-800 bg-white p-2">
						<div className="flex items-center gap-2">
							<button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
								<Plus className="h-5 w-5 text-black" />
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
								className="flex-1 border-0 bg-transparent text-black placeholder-gray-500 outline-none"
								onKeyDown={(e) => e.key === "Enter" && handleSend()}
								disabled={!pdfText}
							/>

							<div className="flex items-center gap-2 border-l text-right border-gray-700 pl-2">
								<button
									className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50"
									disabled={!message.trim() || isLoading || !pdfText}
									onClick={handleSend}
								>
									<Send
										className={`h-5 w-5 ${
											message.trim() && pdfText
												? "text-black"
												: "text-black"
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
