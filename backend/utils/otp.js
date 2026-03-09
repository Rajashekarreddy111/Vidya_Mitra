// OTP generation and expiry helper
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOtpExpiry = () => {
  const tenMinutes = 10 * 60 * 1000;
  return new Date(Date.now() + tenMinutes).toISOString();
};

module.exports = { generateOtp, getOtpExpiry };
