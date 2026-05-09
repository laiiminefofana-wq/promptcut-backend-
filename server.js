```javascript
const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());

// Ensure folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

// Serve processed videos
app.use("/outputs", express.static("outputs"));

// Upload configuration
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

// Free prompt interpreter (no API required)
function interpretPrompt(prompt = "") {
  const text = prompt.toLowerCase();

  const instructions = {
    style: "viral",
    captions: false,
    zoomCuts: false,
    backgroundMusic: "none",
    pace: "normal",
    hookTitle: false
  };

  // Styles
  if (text.includes("mrbeast")) {
    instructions.style = "mrbeast";
    instructions.zoomCuts = true;
    instructions.pace = "very_fast";
    instructions.backgroundMusic = "energetic";
    instructions.hookTitle = true;
  }

  if (text.includes("cinematic")) {
    instructions.style = "cinematic";
    instructions.backgroundMusic = "epic";
  }

  if (text.includes("dramatic")) {
    instructions.style = "dramatic";
    instructions.backgroundMusic = "intense";
  }

  if (text.includes("podcast")) {
    instructions.style = "podcast";
  }

  if (text.includes("trailer")) {
    instructions.style = "trailer";
    instructions.backgroundMusic = "epic";
    instructions.pace = "fast";
    instructions.hookTitle = true;
  }

  if (text.includes("motivational")) {
    instructions.style = "motivational";
    instructions.backgroundMusic = "inspirational";
  }

  if (text.includes("funny")) {
    instructions.style = "funny";
    instructions.pace = "very_fast";
  }

  // Features
  if (text.includes("caption") || text.includes("subtitle")) {
    instructions.captions = true;
  }

  if (text.includes("zoom")) {
    instructions.zoomCuts = true;
  }

  if (text.includes("very fast")) {
    instructions.pace = "very_fast";
  } else if (text.includes("fast")) {
    instructions.pace = "fast";
  }

  if (
    text.includes("hook") ||
    text.includes("title") ||
    text.includes("headline")
  ) {
    instructions.hookTitle = true;
  }

  return instructions;
}

// Home route
app.get("/", (req, res) => {
  res.send("PromptCut AI backend running 🚀");
});

// Main editing route
app.post("/edit", upload.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No video uploaded"
      });
    }

    const prompt = req.body.prompt || "Make this viral";
    const instructions = interpretPrompt(prompt);

    console.log("User Prompt:", prompt);
    console.log("AI Instructions:", instructions);

    const inputPath = req.file.path;
    const outputName = `edited-${Date.now()}.mp4`;
    const outputPath = path.join("outputs", outputName);

    // Base filters
    const filters = ["crop=720:1280"];

    // Caption placeholder overlay
    if (instructions.captions) {
      filters.push(
        "drawtext=text='AUTO CAPTIONS':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=h-180"
      );
    }

    // Style-specific filters
    if (instructions.style === "mrbeast") {
      filters.push("eq=contrast=1.2:saturation=1.3");
    } else if (instructions.style === "cinematic") {
      filters.push("eq=contrast=1.15:saturation=1.05");
    } else if (instructions.style === "dramatic") {
      filters.push("eq=contrast=1.3:saturation=0.8");
    } else if (instructions.style === "motivational") {
      filters.push("eq=contrast=1.1:saturation=1.2");
    } else if (instructions.style === "funny") {
      filters.push("eq=contrast=1.05:saturation=1.4");
    }

    // Optional zoom effect
    if (instructions.zoomCuts) {
      filters.push("scale=720:1280");
    }

    ffmpeg(inputPath)
      .size("720x1280")
      .videoFilters(filters)
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
```
