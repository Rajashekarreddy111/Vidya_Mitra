// YouTube controller for topic-based learning videos
const asyncHandler = require("../utils/asyncHandler");
const { searchYoutubeVideos } = require("../config/youtube");

const getTopicVideos = asyncHandler(async (req, res) => {
  const { topic } = req.query;
  if (!topic) {
    return res.status(400).json({ message: "topic query is required" });
  }

  const videos = await searchYoutubeVideos(topic);
  res.json({ topic, videos });
});

module.exports = { getTopicVideos };
