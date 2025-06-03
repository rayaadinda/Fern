require("dotenv").config()
const express = require("express")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const pdfParse = require("pdf-parse")
const fetch = require("node-fetch")

const app = express()
const PORT = process.env.PORT

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file upload
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = "uploads"
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir)
		}
		cb(null, uploadDir)
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname))
	},
})

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "application/pdf") {
			cb(null, true)
		} else {
			cb(new Error("Only PDF files are allowed!"), false)
		}
	},
})

// Helper function to extract text from PDF
async function extractTextFromPDF(pdfPath) {
	const dataBuffer = fs.readFileSync(pdfPath)
	const data = await pdfParse(dataBuffer)
	return data.text
}

// Helper function to chunk text
function chunkText(text, maxLength = 4000) {
	const chunks = []
	let currentChunk = ""

	const sentences = text.split(". ")

	for (const sentence of sentences) {
		if ((currentChunk + sentence).length < maxLength) {
			currentChunk += sentence + ". "
		} else {
			chunks.push(currentChunk)
			currentChunk = sentence + ". "
		}
	}

	if (currentChunk) {
		chunks.push(currentChunk)
	}

	return chunks
}

// Function to call OpenRouter API
async function callOpenRouter(text) {
	try {
		const response = await fetch(process.env.OPENROUTER_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
				"HTTP-Referer": "http://localhost:5173",
				"X-Title": "Fern Document Summarizer",
			},
			body: JSON.stringify({
				model: "google/gemma-3-1b-it:free",
				messages: [
					{
						role: "system",
						content:
							"You are a document summarization system that creates detailed, well-structured summaries. Follow these guidelines:\n\n" +
							"Format the summary as follows:\n\n" +
							"Title: [Document Title]\n\n" +
							"Overview:\n" +
							"[Brief overview of the document]\n\n" +
							"A. [First Main Section]\n" +
							"   1. [Subsection]\n" +
							"      • [Bullet point]\n" +
							"      • [Bullet point]\n" +
							"   2. [Subsection]\n\n" +
							"B. [Second Main Section]\n" +
							"   [Content]\n\n" +
							"Strengths:\n" +
							"• [Strength point]\n" +
							"• [Strength point]\n\n" +
							"Suggestions for Improvement:\n" +
							"• [Suggestion]\n" +
							"• [Suggestion]\n\n" +
							"Overall:\n" +
							"[Final assessment]\n\n" +
							"Guidelines:\n" +
							"1. Do not use markdown symbols like *, _, or #\n" +
							"2. Use plain text formatting\n" +
							"3. Use proper indentation and spacing\n" +
							"4. Keep technical accuracy and terminology\n" +
							"5. Be objective and clear\n" +
							"6. Use bullet points with • symbol\n" +
							"7. Maintain consistent spacing between sections",
					},
					{
						role: "user",
						content: `Create a detailed, structured summary of this document following the exact format specified:\n\n${text}`,
					},
				],
			}),
		})

		if (!response.ok) {
			const errorData = await response.json()
			console.error("OpenRouter API Error Response:", errorData)
			throw new Error(
				`API request failed with status ${response.status}: ${
					errorData.error || "Unknown error"
				}`
			)
		}

		const data = await response.json()

		if (
			!data ||
			!data.choices ||
			!data.choices[0] ||
			!data.choices[0].message
		) {
			console.error("Unexpected API response structure:", data)
			throw new Error("Invalid response format from API")
		}

		return data.choices[0].message.content
	} catch (error) {
		console.error("OpenRouter API Error:", error)
		throw new Error(`Failed to get summary: ${error.message}`)
	}
}

// Endpoint to handle file upload and summarization
app.post("/api/summarize", upload.single("file"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" })
		}

		// Extract text from PDF
		const text = await extractTextFromPDF(req.file.path)

		if (!text || text.trim().length === 0) {
			throw new Error("No text content found in PDF")
		}

		// Split text into chunks if it's too long
		const chunks = chunkText(text)

		if (chunks.length === 0) {
			throw new Error("Failed to process document content")
		}

		// Generate summary for each chunk
		const summaries = []
		for (const chunk of chunks) {
			try {
				const summary = await callOpenRouter(chunk)
				if (summary) {
					summaries.push(summary)
				}
			} catch (chunkError) {
				console.error("Error processing chunk:", chunkError)
				// Continue with other chunks if one fails
			}
		}

		if (summaries.length === 0) {
			throw new Error("Failed to generate any summaries")
		}

		// Combine summaries if there are multiple chunks
		const finalSummary = summaries.join("\n\n")

		// Clean up uploaded file
		try {
			fs.unlinkSync(req.file.path)
		} catch (unlinkError) {
			console.error("Error cleaning up file:", unlinkError)
			// Don't fail the request if cleanup fails
		}

		res.json({ summary: finalSummary })
	} catch (error) {
		console.error("Error:", error)

		// Clean up file if it exists
		if (req.file && req.file.path) {
			try {
				fs.unlinkSync(req.file.path)
			} catch (unlinkError) {
				console.error("Error cleaning up file after error:", unlinkError)
			}
		}

		res.status(500).json({
			error: "Error processing the document",
			details: error.message,
		})
	}
})

// Start server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
