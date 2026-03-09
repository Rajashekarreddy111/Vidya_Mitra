import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, GraduationCap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import "../styles/pages/Auth.css";

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains special character", test: (p) => /[!@#$%^&*]/.test(p) },
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const failedRules = passwordRules.filter((r) => !r.test(password));
    if (failedRules.length > 0) {
      setError("Password does not meet requirements");
      return;
    }

    try {
      setSubmitting(true);
      await register({ name, email, password });
      setStep("otp");
      toast.success("OTP sent to your email.");
    } catch (err) {
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }

    try {
      setSubmitting(true);
      await verifyOtp({ email, otp: otp.trim() });
      toast.success("Account verified. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "OTP verification failed");
      toast.error(err.message || "OTP verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-icon">
          <GraduationCap size={40} />
        </div>
        <h1>Create Account</h1>
        <p className="subtitle">Join VidyaMitra today</p>

        {error && <div className="error-msg">{error}</div>}

        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <div className="password-rules">
                  {passwordRules.map((rule, i) => (
                    <div key={i} className={`rule ${rule.test(password) ? "rule-pass" : "rule-fail"}`}>
                      {rule.test(password) ? "OK" : "X"} {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <UserPlus size={16} />
              {submitting ? "Creating..." : "Register"}
            </button>
          </form>
        ) : (
          <div className="otp-section">
            <p>Enter the OTP sent to {email}</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: "100%", textAlign: "center", letterSpacing: "4px" }}
            />
            <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={handleVerify} disabled={submitting}>
              Verify & Create Account
            </button>
            <p className="subtitle" style={{ marginTop: "0.75rem" }}>
              Please use the latest OTP from your email inbox.
            </p>
          </div>
        )}

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
