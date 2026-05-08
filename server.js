const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();

const upload = multer({ dest: "uploads/" });

app.use("/outputs", express.static("outputs"));

app.get("/", (req, res) => {
  res.send("PromptCut backend running");
});

app.post("/edit", upload.single("video"), async (req, res) => {
  try {
    const inputPath = req.file.path;

    const outputName = `edited-${Date.now()}.mp4`;
    const outputPath = path.join("outputs", outputName);

    if (!fs.existsSync("outputs")) {
      fs.mkdirSync("outputs");
    }

    ffmpeg(inputPath)
      .videoFilters([
        "scale=1080:1920:force_original_aspect_ratio=increase",
        "crop=1080:1920",
        "eq=contrast=1.1:brightness=0.03:saturation=1.2"
      ])
      .outputOptions([
        "-preset fast",
        "-crf 23"
      ])
      .save(outputPath)
      .on("end", () => {
        res.json({
          success: true,
          video: `/outputs/${outputName}`
        });
      })
      .on("error", (err) => {
        console.log(err);
        res.status(500).json({
          error: "Video processing failed"
        });
      });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Server error"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
