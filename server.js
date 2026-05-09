const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

// Serve edited videos
app.use("/outputs", express.static("outputs"));

// Upload configuration
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

// Convert natural-language prompt into JSON instructions
async function interpretPrompt(prompt) {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: `
Convert this video editing request into valid JSON only.

Prompt: "${prompt}"

Return ONLY JSON with these keys:
{
  "style": "string",
  "captions": true,
  "zoomCuts": true,
  "backgroundMusic": "string",
  "pace": "string",
  "hookTitle": true
}
`
  });

  const text = response.output_text.trim();
  return JSON.parse(text);
}

// Home route
app.get("/", (req, res) => {
  res.send("PromptCut AI backend running 🚀");
});

// Main editing route
app.post("/edit", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No video uploaded"
      });
    }

    const prompt = req.body.prompt || "Make this viral";

    // Ask OpenAI to interpret the prompt
    const instructions = await interpretPrompt(prompt);

    // Log instructions in Railway logs
    console.log("User Prompt:", prompt);
    console.log("AI Instructions:", instructions);

    const inputPath = req.file.path;
    const outputName = `edited-${Date.now()}.mp4`;
    const outputPath = path.join("outputs", outputName);

    // Basic processing (you will expand this later)
    ffmpeg(inputPath)
      .size("720x1280")
      .videoFilters([
        "crop=720:1280"
      ])
      .outputOptions([
        "-preset ultrafast",
        "-crf 32"
      ])
      .videoCodec("libx264")
      .audioCodec("aac")
      .save(outputPath)

      .on("end", () => {
        res.json({
          success: true,
          prompt,
          instructions,
          video: `/outputs/${outputName}`
        });
      })

      .on("error", (err) => {
        console.log("FFmpeg Error:", err);

        res.status(500).json({
          error: err.message
        });
      });

  } catch (error) {
    console.log("Server Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
