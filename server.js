const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

// Create folders if they don't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
if (!fs.existsSync("outputs")) {
  fs.mkdirSync("outputs");
}

// Multer setup
const upload = multer({ dest: "uploads/" });

// Upload + process route
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const inputPath = req.file.path;
  const outputPath = path.join(
    "outputs",
    `output-${Date.now()}.mp4`
  );

  // FFmpeg command (basic vertical format)
  const command = `
    ffmpeg -i ${inputPath}
    -vf "scale=1080:1920,setsar=1"
    -c:v libx264
    -preset fast
    -crf 23
    -c:a aac
    -b:a 128k
    ${outputPath}
  `;

  exec(command, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error processing video");
    }

    res.download(outputPath, () => {
      // Cleanup files after download
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

// Root route (for testing)
app.get("/", (req, res) => {
  res.send("PromptCut backend is running 🚀");
});

// IMPORTANT for Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
