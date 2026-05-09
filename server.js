const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

app.use("/outputs", express.static("outputs"));

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

app.get("/", (req, res) => {
  res.send("PromptCut AI backend running 🚀");
});

app.post("/edit", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video uploaded" });
  }

  const prompt = (req.body.prompt || "").toLowerCase();

  const inputPath = req.file.path;
  const outputName = `edited-${Date.now()}.mp4`;
  const outputPath = path.join("outputs", outputName);

  let filters = [
    "crop=720:1280"
  ];

  // Different styles based on prompt
  if (prompt.includes("dramatic")) {
    filters.push("eq=contrast=1.3:saturation=0.8");
  } else if (prompt.includes("cinematic")) {
    filters.push("eq=contrast=1.15:saturation=1.1");
  } else if (prompt.includes("mrbeast")) {
    filters.push("eq=contrast=1.2:saturation=1.3");
  } else if (prompt.includes("tiktok")) {
    filters.push("eq=contrast=1.1:saturation=1.2");
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
        video: `/outputs/${outputName}`
      });
    })

    .on("error", (err) => {
      console.log("FFmpeg Error:", err);
      res.status(500).json({
        error: err.message
      });
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
