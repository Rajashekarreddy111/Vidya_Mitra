// JWT authentication middleware
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerMatch = typeof authHeader === "string" ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
    const bearerToken = bearerMatch?.[1] ? bearerMatch[1].trim() : null;
    const cookieToken = req.cookies?.vidyamitra_token;
    const rawToken = bearerToken || cookieToken;
    const token = typeof rawToken === "string" ? rawToken.replace(/^"+|"+$/g, "").trim() : rawToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, is_verified, profile_photo")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized: invalid user" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

module.exports = { protect };
