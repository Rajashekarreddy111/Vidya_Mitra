// YouTube Data API helper
const axios = require("axios");

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

const searchYoutubeVideos = async (topic) => {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is required");
  }

  const response = await axios.get(YOUTUBE_API_URL, {
    params: {
      part: "snippet",
      q: `${topic} tutorial`,
      maxResults: 8,
      type: "video",
      key: process.env.YOUTUBE_API_KEY,
    },
    timeout: 15000,
  });

  return response.data.items.map((item) => ({
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    publishedAt: item.snippet.publishedAt,
  }));
};

module.exports = { searchYoutubeVideos };
