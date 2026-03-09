// Resume controller: upload, store URL, and AI analysis
const cloudinary = require("../config/cloudinary");
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { extractJsonFromText } = require("../utils/aiParser");
const { generateGeminiText } = require("../utils/geminiRequest");
const { randomUUID } = require("crypto");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const sanitizeBaseName = (name) =>
  String(name || "resume")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "resume";

const uploadBufferToCloudinary = (buffer, originalName) => {
  const safeName = sanitizeBaseName(originalName);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "vidyamitra/resumes",
        resource_type: "raw",
        public_id: `${Date.now()}-${safeName}`,
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const getFileExtension = (name) => {
  const dotIndex = String(name || "").lastIndexOf(".");
  if (dotIndex === -1) return "";
  return String(name).slice(dotIndex).toLowerCase();
};

const clipText = (text, maxChars) => String(text || "").slice(0, maxChars);

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
};

const normalizeResumeAnalysis = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const strengths = toStringArray(payload.strengths || payload.good);
  const missingSkills = toStringArray(payload.missingSkills || payload.missing_skills || payload.lacking);
  const improvements = toStringArray(payload.improvements || payload.improvement || payload.suggestions);

  if (strengths.length === 0 && missingSkills.length === 0 && improvements.length === 0) {
    return null;
  }

  return { strengths, missingSkills, improvements };
};

const analyzeResumeWithGemini = async (resumeText) => {
  const clippedResumeText = clipText(resumeText, 12000);
  const basePrompt = `
You are an AI career guidance assistant. Analyze the following resume text for a candidate and provide a helpful career focused evaluation. Identify strengths based on skills and experience, detect missing skills required for employability, and give clear actionable improvement suggestions.

Return JSON only in this format:
{
  "strengths": ["..."],
  "missingSkills": ["..."],
  "improvements": ["..."]
}

Requirements
Provide at least 5 strengths, 5 missing skills and 5 improvement suggestions.
Keep suggestions practical and job oriented.
Avoid generic statements and focus on real resume enhancement.

Resume text:
${clippedResumeText}
  `;

  const strictPrompt = `${basePrompt}
Strict output rules:
- Return only valid JSON (no markdown, no explanation text).
- Use double quotes for all keys and string values.
- Keep keys exactly as: strengths, missingSkills, improvements.
- Each key must contain at least 5 items.`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const text = await generateGeminiText(attempt === 0 ? basePrompt : strictPrompt);
    const parsed = extractJsonFromText(text);
    const normalized = normalizeResumeAnalysis(parsed);
    if (normalized) return normalized;
  }

  return {
    strengths: [],
    missingSkills: [],
    improvements: ["Could not parse AI response, please retry"],
  };
};

const getFallbackAnalysis = () => ({
  strengths: [],
  missingSkills: [],
  improvements: ["AI analysis is temporarily unavailable. Resume uploaded successfully."],
});

const getNoTextAnalysis = () => ({
  strengths: [],
  missingSkills: [],
  improvements: [
    "Resume uploaded successfully.",
    "Detailed analysis needs extracted text. Please upload a TXT resume for best results.",
  ],
});

const cleanExtractedText = (text) => String(text || "").replace(/\s+/g, " ").trim();

const extractTextFromPdf = async (buffer) => {
  const result = await pdfParse(buffer);
  return cleanExtractedText(result?.text);
};

const extractTextFromDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return cleanExtractedText(result?.value);
};

const extractResumeTextFromFile = async (file, extension) => {
  const mime = String(file?.mimetype || "").toLowerCase();
  const ext = String(extension || "").toLowerCase();

  if (mime === "text/plain" || ext === ".txt") {
    return cleanExtractedText(file?.buffer?.toString("utf-8") || "");
  }

  if (mime === "application/pdf" || ext === ".pdf") {
    return extractTextFromPdf(file.buffer);
  }

  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx") {
    return extractTextFromDocx(file.buffer);
  }

  return "";
};

const requiredColumnFromError = (error) => {
  const msg = String(error?.message || "");
  const match = msg.match(/null value in column "([^"]+)"/i);
  return match?.[1] || null;
};

const unknownColumnFromError = (error) => {
  const msg = String(error?.message || "");
  const match = msg.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
};

const getCompatValueForColumn = (column, payload) => {
  const key = String(column || "").toLowerCase();

  const map = {
    id: payload.id,
    user_id: payload.user_id,
    userid: payload.user_id,
    filename: payload.filename,
    file_name: payload.filename,
    name: payload.filename,
    resume_url: payload.resume_url,
    file_url: payload.resume_url,
    url: payload.resume_url,
    storage_path: payload.storage_path,
    path: payload.storage_path,
    object_path: payload.storage_path,
    public_id: payload.storage_path,
    resume_text: payload.resume_text,
    text: payload.resume_text,
    content: payload.resume_text,
    analysis: payload.analysis,
    result_json: payload.analysis,
    mime_type: payload.mime_type,
    file_type: payload.mime_type,
    content_type: payload.mime_type,
    size: payload.file_size,
    file_size: payload.file_size,
  };

  return map[key];
};

const insertResumeRecord = async (payload) => {
  const base = {
    user_id: payload.user_id,
    resume_url: payload.resume_url,
    resume_text: payload.resume_text,
    analysis: payload.analysis,
  };

  const legacy = {
    ...base,
    filename: payload.filename,
    storage_path: payload.storage_path,
    mime_type: payload.mime_type,
    file_size: payload.file_size,
  };

  const attempts = [legacy, base];
  let lastError = null;

  for (const initialRecord of attempts) {
    let record = { ...initialRecord };

    for (let retry = 0; retry < 4; retry += 1) {
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await supabase.from("resumes").insert([record]).select("*").single();
      if (!error && data) return data;
      lastError = error;

      const unknownColumn = unknownColumnFromError(error);
      if (unknownColumn) {
        // Schema compatibility: drop columns that don't exist in this DB.
        // eslint-disable-next-line no-unused-vars
        const { [unknownColumn]: _removed, ...rest } = record;
        record = rest;
        continue;
      }

      const missingColumn = requiredColumnFromError(error);
      if (!missingColumn) break;

      const compatValue = getCompatValueForColumn(missingColumn, payload);
      if (compatValue === undefined || compatValue === null) break;

      record = { ...record, [missingColumn]: compatValue };
    }
  }

  throw new Error(lastError?.message || "Failed to save resume");
};

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Resume file is required" });
  }

  let detectedType = null;
  try {
    const { fileTypeFromBuffer } = await import("file-type");
    detectedType = await fileTypeFromBuffer(req.file.buffer);
  } catch (_error) {
    detectedType = null;
  }
  const declaredMime = req.file.mimetype;
  const extension = getFileExtension(req.file.originalname);
  const allowedMimes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]);
  const genericMimeWithAllowedExt =
    declaredMime === "application/octet-stream" &&
    [".pdf", ".doc", ".docx", ".txt"].includes(extension);

  if (!allowedMimes.has(declaredMime) && !genericMimeWithAllowedExt) {
    return res.status(400).json({ message: "Unsupported file type" });
  }

  if (
    (declaredMime === "application/pdf" || extension === ".pdf") &&
    detectedType?.mime &&
    detectedType.mime !== "application/pdf"
  ) {
    return res.status(400).json({ message: "Invalid PDF file content" });
  }

  if (
    (declaredMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === ".docx") &&
    detectedType &&
    !["application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
      detectedType.mime
    )
  ) {
    return res.status(400).json({ message: "Invalid DOCX file content" });
  }

  if ((declaredMime === "text/plain" || extension === ".txt") && detectedType && detectedType.mime !== "text/plain") {
    return res.status(400).json({ message: "Invalid TXT file content" });
  }

  let uploadResult;
  try {
    uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
  } catch (_error) {
    const err = new Error("File upload service failed. Please check Cloudinary credentials/config.");
    err.statusCode = 502;
    throw err;
  }
  if (!uploadResult?.secure_url) {
    const err = new Error("File upload failed: cloud storage did not return a file URL.");
    err.statusCode = 502;
    throw err;
  }
  const resumeUrl = uploadResult.secure_url;
  const storagePath = uploadResult.public_id || uploadResult.secure_url;

  let resumeText = String(req.body.resumeText || "").trim();
  const hasProvidedText = Boolean(String(req.body.resumeText || "").trim());
  const isTxtFile = req.file.mimetype === "text/plain" || extension === ".txt";

  if (!resumeText) {
    try {
      resumeText = await extractResumeTextFromFile(req.file, extension);
    } catch (_error) {
      resumeText = "";
    }
  }

  const hasExtractedText = Boolean(String(resumeText || "").trim());

  let analysis;
  if (!hasProvidedText && !hasExtractedText) {
    resumeText = "Resume uploaded. Text extraction not available for this file.";
    analysis = getNoTextAnalysis();
  } else {
    try {
      analysis = await analyzeResumeWithGemini(resumeText);
    } catch (_error) {
      // Upload should still succeed even if AI service is down/rate-limited.
      analysis = getFallbackAnalysis();
    }
  }

  const resume = await insertResumeRecord({
    id: randomUUID(),
    user_id: req.user.id,
    filename: req.file.originalname,
    resume_url: resumeUrl,
    storage_path: storagePath,
    mime_type: req.file.mimetype,
    file_size: req.file.size,
    resume_text: resumeText,
    analysis,
  });

  res.status(201).json({
    message: "Resume uploaded and analyzed successfully",
    resume,
  });
});

const getMyResumes = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  res.json({ resumes: data });
});

module.exports = { uploadResume, getMyResumes };
