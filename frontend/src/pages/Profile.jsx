import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { User, Camera, Lock } from "lucide-react";
import { toast } from "sonner";
import "../styles/pages/Profile.css";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateProfile({ name: name.trim() });
      toast.success("Profile name updated!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile name");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("File size should be less than 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateProfile({ profilePhoto: reader.result });
        toast.success("Profile photo updated!");
      } catch (error) {
        toast.error(error.message || "Failed to update profile photo");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="profile-container container">
        <div className="card card-constrained">
          <div className="profile-header">
            <div className="avatar-upload">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="avatar-edit-btn" onClick={() => fileInputRef.current.click()}>
                <Camera size={18} />
              </div>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handlePhotoUpload} />
            </div>
            <h2>{user?.name || "User"}</h2>
            <p className="subtitle">{user?.email}</p>
          </div>

          <div className="profile-section">
            <h3><User size={18} style={{ verticalAlign: "middle", marginRight: 8 }} /> Basic Information</h3>
            <form onSubmit={handleUpdateName} className="profile-form">
              <div className="form-group">
                <label className="info-label">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
              </div>
              <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start" }}>
                Update Name
              </button>
            </form>
          </div>

          <div className="profile-section" style={{ marginTop: "2rem" }}>
            <h3><Lock size={18} style={{ verticalAlign: "middle", marginRight: 8 }} /> Security</h3>
            <button className="btn-primary" onClick={() => navigate("/forgot-password")} style={{ background: "#f1f5f9", color: "#1e293b" }}>
              Change Password (via OTP)
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
