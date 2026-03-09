import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import "../styles/pages/Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ email });
      setStep(2);
      toast.success("If the account exists, OTP was sent.");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      toast.error("Please enter OTP");
      return;
    }
    setStep(3);
    toast.success("OTP captured. Set your new password.");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.new.length < 8) {
      toast.error("Min 8 characters required");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email, otp: otp.trim(), newPassword: passwords.new });
      toast.success("Password reset successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 400 }}>
        <div className="logo-icon">
          <GraduationCap size={40} />
        </div>
        <h1>Reset Password</h1>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <p className="subtitle">Enter email to receive OTP</p>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Mail size={16} /> {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="otp-section" style={{ textAlign: "center" }}>
            <p className="subtitle">Enter OTP from your email</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: "100%", textAlign: "center", letterSpacing: "4px", marginBottom: "1rem" }}
            />
            <button className="btn-primary" onClick={handleVerifyOtp}>
              <ShieldCheck size={16} /> Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p className="subtitle">Create a new password</p>
            <div className="form-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="auth-link">
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
