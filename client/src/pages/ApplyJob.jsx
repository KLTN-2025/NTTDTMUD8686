import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import kConvert from "k-convert";
import moment from "moment";
// import JobCard from "../components/JobCard";
import Footer from "../components/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
  FiFlag,
} from "react-icons/fi";

const ApplyJob = () => {
  const { id } = useParams();
  const { getToken, isSignedIn } = useAuth();
  const { openSignIn } = useClerk(); // 👈 popup đăng nhập của Clerk

  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);

  // --- state cho report ---
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "", description: "" });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const {
    jobs = [],
    backendUrl,
    userData,
    userApplications = [],
    fetchUserApplications,
  } = useContext(AppContext);

  // Fetch job details
  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) {
        setJobData(data.job);
        findSimilarJobs(data.job);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to fetch job details. Please try again later.");
    }
  };

  // Find similar jobs
  const findSimilarJobs = (currentJob) => {
    const similar = jobs
      .filter(
        (job) =>
          job._id !== currentJob._id &&
          (job.companyId._id === currentJob.companyId._id ||
            job.category === currentJob.category)
      )
      .slice(0, 4);
    setSimilarJobs(similar);
  };

  // Handle job application
  const applyHandler = async () => {
    try {
      if (!userData) {
        toast.info("Please login to apply.");
        openSignIn(); // 👈 mở popup đăng nhập Clerk
        return;
      }

      if (!userData.resume) {
        return toast.error("Please upload a resume before applying.");
      }

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/users/apply`,
        { jobId: jobData?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Application submitted successfully!");
        fetchUserApplications();
        setAlreadyApplied(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error applying for the job. Please try again.");
    }
  };

  // Gửi báo cáo vi phạm
  const handleSubmitReport = async () => {
    // Nếu chưa đăng nhập => mở popup Clerk
    if (!isSignedIn) {
      toast.info("Vui lòng đăng nhập để gửi báo cáo.");
      openSignIn(); // 👈 Mở popup đăng nhập Clerk
      return;
    }

    if (!reportForm.reason.trim()) {
      toast.warn("Vui lòng chọn lý do báo cáo.");
      return;
    }

    try {
      setReportSubmitting(true);

      const token = await getToken(); // 👈 Lấy token Clerk cho user hiện tại
      const payload = {
        jobId: jobData?._id,
        userName: userData?.name || userData?.email,
        userEmail: userData?.email,
        reason: reportForm.reason.trim(),
        description: reportForm.description.trim(),
      };
      console.log("data", payload);

      // 👇 gửi kèm token để BE nhận dạng req.auth.userId
      const { data } = await axios.post(`${backendUrl}/api/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Đã gửi báo cáo vi phạm. Cảm ơn bạn!");
        setShowReportForm(false);
        setReportForm({ reason: "", description: "" });
      } else {
        toast.error(data.message || "Gửi báo cáo thất bại.");
      }
    } catch (err) {
      console.error("Report submit error:", err);
      toast.error(
        err.response?.data?.message ||
          "Không thể gửi báo cáo. Vui lòng thử lại."
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  // Check if user already applied
  const checkAlreadyApplied = () => {
    if (jobData && userApplications && userApplications.length > 0) {
      const hasApplied = userApplications.some(
        (item) => item.jobId?._id === jobData._id
      );
      setAlreadyApplied(hasApplied);
    }
  };

  useEffect(() => {
    if (id) fetchJob();
  }, [id, backendUrl]);

  useEffect(() => {
    checkAlreadyApplied();
  }, [jobData, userApplications]);

  if (isLoading || !jobData) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Job Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start space-x-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-3 rounded-lg shadow-lg border border-white/20"
                  >
                    <img
                      className="h-20 w-20 object-contain"
                      src={jobData?.companyId?.image || assets.placeholder}
                      alt="Company Logo"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {jobData?.title}
                    </h1>
                    <p className="text-xl text-blue-100 mt-1">
                      {jobData?.companyId?.name}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center text-blue-100">
                        <FiMapPin className="mr-2" />
                        {jobData?.location}
                      </div>
                      <div className="flex items-center text-blue-100">
                        <FiBriefcase className="mr-2" />
                        {jobData?.level}
                      </div>
                      <div className="flex items-center text-blue-100">
                        <FiDollarSign className="mr-2" />
                        {jobData?.salary
                          ? kConvert.convertTo(jobData.salary)
                          : "Competitive"}
                      </div>
                      <div className="flex items-center text-blue-100">
                        <FiClock className="mr-2" />
                        Posted {moment(jobData?.date).fromNow()}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center gap-3"
                >
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all ${
                      isAlreadyApplied
                        ? "bg-emerald-600 text-white flex items-center"
                        : "bg-white text-blue-600 hover:bg-blue-50 hover:shadow-xl"
                    }`}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Applied Successfully
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Job Details */}
              <div className="lg:w-2/3">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-md p-8 mb-8"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Job Description
                  </h2>
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: jobData?.description || "",
                    }}
                  ></div>
                </motion.div>

                {/* Requirements */}
                {jobData?.requirements && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-8 mb-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Requirements
                    </h2>
                    <div
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: jobData.requirements,
                      }}
                    ></div>
                  </motion.div>
                )}

                {/* Benefits */}
                {jobData?.benefits && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl shadow-md p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Benefits
                    </h2>
                    <div
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: jobData.benefits,
                      }}
                    ></div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                {/* Company Info */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    About {jobData?.companyId?.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {jobData?.companyId?.description ||
                      "Leading company in their industry."}
                  </p>
                  <a
                    href={`/company/${jobData?.companyId?._id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    View company profile <FiExternalLink className="ml-1" />
                  </a>
                </motion.div>

                {/* Similar Jobs */}
                {/* <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Similar Jobs
                  </h3>
                  <div className="space-y-4">
                    {similarJobs.length > 0 ? (
                      similarJobs.map((job) => (
                        <JobCard key={job._id} job={job} compact />
                      ))
                    ) : (
                      <p className="text-gray-500">No similar jobs found</p>
                    )}
                  </div>
                </motion.div> */}

                {/* Quick Apply */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-50 border border-blue-100 rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Ready to apply?
                  </h3>
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-all ${
                      isAlreadyApplied
                        ? "bg-emerald-600 text-white flex items-center justify-center"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                    }`}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Application Submitted
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                  {!userData?.resume && !isAlreadyApplied && (
                    <p className="mt-3 text-sm text-blue-800">
                      Don't forget to upload your resume first
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
            {/* Nút báo cáo vi phạm */}
            <button
              onClick={() => setShowReportForm(true)}
              className="px-8 py-3 rounded-lg font-semibold shadow-md bg-red-600 text-white hover:bg-red-700 flex items-center"
            >
              <FiFlag className="mr-2" /> Report this job
            </button>

            {!isAlreadyApplied && (
              <p className="mt-2 text-blue-400 text-sm">
                {userData?.resume
                  ? "Your resume is ready"
                  : "Upload resume to apply"}
              </p>
            )}
          </div>
        </div>

        {/* Popup Report */}
        {showReportForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button
                onClick={() => setShowReportForm(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>

              <h2 className="text-lg font-semibold mb-4">Báo cáo vi phạm</h2>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do
              </label>
              <select
                className="w-full border rounded-md p-2 mb-3"
                value={reportForm.reason}
                onChange={(e) =>
                  setReportForm((s) => ({ ...s, reason: e.target.value }))
                }
              >
                <option value="">-- Chọn 1 Lý do --</option>
                <option value="Công việc giả mạo">Công việc giả mạo</option>
                <option value="Yêu cầu tiền/ nạp tiền">
                  Yêu cầu tiền/ nạp tiền
                </option>
                <option value="Nội dung không phù hợp">
                  Nội dung không phù hợp
                </option>
                <option value="Khác">Khác</option>
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                rows="4"
                className="w-full border rounded-md p-2"
                value={reportForm.description}
                onChange={(e) =>
                  setReportForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="Thêm thông tin chi tiết nếu cần..."
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={reportSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {reportSubmitting ? "Sending..." : "Send report"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </motion.div>
    </>
  );
};

export default ApplyJob;
