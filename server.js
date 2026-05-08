const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// ENABLE CORS
app.use(cors());

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("outputs")) {
  fs.mkdirSync("outputs");
}

app.use("/outputs", express.static("outputs"));

const upload = multer({
  dest: "uploads/"
});

app.get("/", (req, res) => {
  res.send("PromptCut backend running 🚀");
});

app.post("/edit", upload.single("video"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      error: "No video uploaded"
    });
  }

  const inputPath = req.file.path;

  const outputName = `edited-${Date.now()}.mp4`;

  const outputPath = path.join("outputs", outputName);

  ffmpeg(inputPath)
    .videoFilters([
      "scale=1080:1920:force_original_aspect_ratio=increase",
      "crop=1080:1920",
      "eq=contrast=1.05:brightness=0.02:saturation=1.15"
    ])
    .outputOptions([
      "-preset ultrafast",
      "-crf 28"
    ])
    .videoCodec("libx264")
    .audioCodec("aac")
    .save(outputPath)

    .on("end", () => {

      res.json({
        success: true,
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
