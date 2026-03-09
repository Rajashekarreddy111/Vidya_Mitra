// Authentication controller: register, OTP verify, login, forgot/reset password
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken } = require("../utils/jwt");
const { generateOtp, getOtpExpiry } = require("../utils/otp");
const { sendBrevoEmail } = require("../config/brevo");
const OTP_MAX_ATTEMPTS = 5;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  is_verified: user.is_verified,
  profilePhoto: user.profile_photo || null,
});

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existingUser) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otpCode = generateOtp();
  const otpExpiresAt = getOtpExpiry();

  const { data: user, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        is_verified: false,
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
        otp_attempts: 0,
      },
    ])
    .select("id, name, email, is_verified, profile_photo")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await sendBrevoEmail({
      to: email,
      subject: "VidyaMitra OTP Verification",
      htmlContent: `<p>Hello ${name},</p><p>Your OTP is <b>${otpCode}</b>. It will expire in 10 minutes.</p>`,
    });
  } catch (emailError) {
    await supabase.from("users").delete().eq("id", user.id);
    throw emailError;
  }

  res.status(201).json({
    message: "Registered successfully. Please verify OTP sent to email.",
    user: sanitizeUser(user),
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.is_verified) {
    return res.status(400).json({ message: "Account already verified" });
  }

  if ((user.otp_attempts || 0) >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ message: "Too many invalid OTP attempts. Please request a new OTP." });
  }

  if (user.otp_code !== otp) {
    await supabase
      .from("users")
      .update({ otp_attempts: (user.otp_attempts || 0) + 1 })
      .eq("id", user.id);
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      is_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_attempts: 0,
    })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  res.json({ message: "OTP verified successfully. Account activated." });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.is_verified) {
    return res.status(403).json({ message: "Please verify your email OTP first" });
  }

  const token = generateToken({ userId: user.id });
  res.cookie("vidyamitra_token", token, getCookieOptions());

  res.json({
    message: "Login successful",
    token,
    user: sanitizeUser(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!user) {
    return res.json({ message: "If email exists, reset OTP has been sent" });
  }

  const resetOtp = generateOtp();
  const resetOtpExpiry = getOtpExpiry();

  const { error } = await supabase
    .from("users")
    .update({
      reset_otp: resetOtp,
      reset_otp_expires_at: resetOtpExpiry,
      reset_otp_attempts: 0,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  await sendBrevoEmail({
    to: user.email,
    subject: "VidyaMitra Password Reset OTP",
    htmlContent: `<p>Hello ${user.name},</p><p>Your password reset OTP is <b>${resetOtp}</b>. It will expire in 10 minutes.</p>`,
  });

  res.json({ message: "If email exists, reset OTP has been sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if ((user.reset_otp_attempts || 0) >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ message: "Too many invalid reset OTP attempts. Please request a new OTP." });
  }

  if (user.reset_otp !== otp) {
    await supabase
      .from("users")
      .update({ reset_otp_attempts: (user.reset_otp_attempts || 0) + 1 })
      .eq("id", user.id);
    return res.status(400).json({ message: "Invalid reset OTP" });
  }

  if (!user.reset_otp_expires_at || new Date(user.reset_otp_expires_at) < new Date()) {
    return res.status(400).json({ message: "Reset OTP expired" });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: newPasswordHash,
      reset_otp: null,
      reset_otp_expires_at: null,
      reset_otp_attempts: 0,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  res.json({ message: "Password reset successful" });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, profilePhoto, profile_photo: profilePhotoSnake } = req.body;
  const updates = {};

  if (name !== undefined) {
    updates.name = String(name).trim();
  }

  if (profilePhoto !== undefined || profilePhotoSnake !== undefined) {
    const photoValue = profilePhoto !== undefined ? profilePhoto : profilePhotoSnake;
    const normalizedPhoto = String(photoValue || "").trim();
    updates.profile_photo = normalizedPhoto || null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No profile fields provided for update" });
  }

  const { data: updatedUser, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.user.id)
    .select("id, name, email, is_verified, profile_photo")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  res.json({
    message: "Profile updated successfully",
    user: sanitizeUser(updatedUser),
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("vidyamitra_token", getClearCookieOptions());
  res.json({ message: "Logged out successfully" });
});

module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logoutUser,
};
