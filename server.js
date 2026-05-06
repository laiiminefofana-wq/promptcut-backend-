const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

// Ensure folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

// File upload setup
const upload = multer({ dest: "uploads/" });

// Upload route
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const inputPath = req.file.path;
  const outputPath = path.join("outputs", `output-${Date.now()}.mp4`);

  const command = `
  ffmpeg -y -i "${inputPath}" \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 \
  -preset ultrafast \
  -crf 28 \
  -c:a aac \
  -b:a 128k \
  "${outputPath}"
  `;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("FFmpeg error:", stderr);
      return res.status(500).send(stderr);
    }

    res.download(outputPath, () => {
      // Clean up
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("PromptCut backend is running 🚀");
});

// Use dynamic port (IMPORTANT for Railway)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
