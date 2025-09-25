import { type ReactNode } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Eye,
  MessageSquare,
  Settings,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useAuthStatus } from "@/features/accounts/hooks/useAuth";

// —— Types ——
export type UserType = "freelancer" | "client" | "admin";

type Trend = "up" | "down" | "neutral";

type Status = "active" | "pending" | "completed" | "paused" | "closed";

interface Stat {
  id: string;
  label: string;
  value: string;
  change?: string;
  trend?: Trend;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  type: "message" | "application" | "interview" | "payment" | "profile";
  status?: "success" | "pending" | "warning";
}

interface Project {
  id: string;
  title: string;
  company: string;
  rate: string;
  status: Extract<Status, "active" | "pending" | "completed">;
  deadline: string;
  progress?: number;
}

interface JobPosting {
  id: string;
  title: string;
  applications: number;
  views: number;
  status: Extract<Status, "active" | "paused" | "closed">;
  posted: string;
}

// minimal user shape we actually read in this component
interface AuthUser {
  user_type?: UserType | null;
  first_name?: string | null;
  username: string;
}

// —— Component ——
const Dashboard = (): JSX.Element => {
  const { user, isLoading, isAuthenticated } = useAuthStatus<{
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  }>();

  // Loading UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f6f4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666666]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Logged out UI
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666666]">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  const userType: UserType = user.user_type ?? "freelancer";

  // —— Demo data (replace with API data when wired) ——
  const professionalStats: Stat[] = [
    { id: "1", label: "Active Projects", value: "3", change: "+1", trend: "up" },
    { id: "2", label: "This Month Earnings", value: "€4,250", change: "+12%", trend: "up" },
    { id: "3", label: "Profile Views", value: "127", change: "+8", trend: "up" },
    { id: "4", label: "Success Rate", value: "98%", change: "0%", trend: "neutral" },
  ];

  const professionalActivity: RecentActivity[] = [
    { id: "a", title: "New message from DataFeedWatch", time: "2h ago", type: "message", status: "success" },
    { id: "b", title: "Project milestone completed", time: "4h ago", type: "application", status: "success" },
    { id: "c", title: "Interview scheduled for tomorrow", time: "1d ago", type: "interview", status: "pending" },
    { id: "d", title: "Payment received - €1,250", time: "2d ago", type: "payment", status: "success" },
  ];

  const activeProjects: Project[] = [
    {
      id: "1",
      title: "E-commerce Platform Redesign",
      company: "DataFeedWatch",
      rate: "€85/hour",
      status: "active",
      deadline: "Dec 15, 2024",
      progress: 75,
    },
    {
      id: "2",
      title: "Mobile App Development",
      company: "Nordic Startup",
      rate: "€90/hour",
      status: "active",
      deadline: "Jan 20, 2025",
      progress: 45,
    },
    {
      id: "3",
      title: "Design System Creation",
      company: "TechCorp",
      rate: "€80/hour",
      status: "pending",
      deadline: "Feb 10, 2025",
      progress: 0,
    },
  ];

  const companyStats: Stat[] = [
    { id: "1", label: "Active Job Posts", value: "5", change: "+2", trend: "up" },
    { id: "2", label: "Applications Received", value: "47", change: "+15", trend: "up" },
    { id: "3", label: "Interviews Scheduled", value: "8", change: "+3", trend: "up" },
    { id: "4", label: "Hired This Month", value: "2", change: "+2", trend: "up" },
  ];

  const companyActivity: RecentActivity[] = [
    { id: "a", title: "New application for Frontend Developer", time: "1h ago", type: "application", status: "success" },
    { id: "b", title: "Interview completed with Erik A.", time: "3h ago", type: "interview", status: "success" },
    { id: "c", title: "Job post 'UX Designer' went live", time: "1d ago", type: "profile", status: "success" },
    { id: "d", title: "Contract signed with Astrid H.", time: "2d ago", type: "payment", status: "success" },
  ];

  const jobPostings: JobPosting[] = [
    { id: "1", title: "Senior Frontend Developer", applications: 12, views: 89, status: "active", posted: "3 days ago" },
    { id: "2", title: "UX/UI Designer", applications: 8, views: 67, status: "active", posted: "1 week ago" },
    { id: "3", title: "Full Stack Developer", applications: 15, views: 134, status: "paused", posted: "2 weeks ago" },
  ];

  // —— Helpers ——
  const getStatusColor = (status: Status): string => {
    switch (status) {
      case "active":
        return "text-[#7ba05b] bg-[#7ba05b]/10";
      case "pending":
        return "text-[#c8956d] bg-[#c8956d]/10";
      case "completed":
        return "text-[#4a90a4] bg-[#4a90a4]/10";
      case "paused":
        return "text-[#999999] bg-[#999999]/10";
      case "closed":
        return "text-[#666666] bg-[#666666]/10";
      default:
        return "text-[#666666] bg-[#f4f3f0]";
    }
  };

  const getTrendIcon = (trend?: Trend): ReactNode => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-[#7ba05b]" />;
    if (trend === "down") return <TrendingUp className="w-3 h-3 text-[#c8956d] rotate-180" />;
    return null;
  };

  const getUserTypeDisplayName = (type: UserType): string => {
    switch (type) {
      case "freelancer":
        return "Professional";
      case "client":
        return "Company";
      case "admin":
        return "Administrator";
      default:
        return "User";
    }
  };

  // —— Sub-views ——
  const renderProfessionalDashboard = (): JSX.Element => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {professionalStats.map((stat) => (
          <div
            key={stat.id}
            className="bg-[#ffffff] border border-[#e8e6e3] rounded-3xl p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-semibold text-[#1a1a1a]">{stat.value}</div>
              {getTrendIcon(stat.trend)}
            </div>
            <div className="text-sm text-[#666666] mb-1">{stat.label}</div>
            {stat.change ? (
              <div
                className={`text-xs ${
                  stat.trend === "up"
                    ? "text-[#7ba05b]"
                    : stat.trend === "down"
                    ? "text-[#c8956d]"
                    : "text-[#666666]"
                }`}
              >
                {stat.change}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Projects */}
        <div className="lg:col-span-2 bg-[#ffffff] border border-[#e8e6e3] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#1a1a1a]">Active Projects</h3>
            <button className="text-[#4a90a4] hover:text-[#2c3e50] text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="border border-[#e8e6e3] rounded-2xl p-6 hover:bg-[#f7f6f4] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-1">{project.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-[#666666]">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {project.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {project.rate}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>
                {typeof project.progress === "number" && project.progress > 0 ? (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#666666]">Progress</span>
                      <span className="text-[#1a1a1a] font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-[#f4f3f0] rounded-full h-2">
                      <div
                        className="bg-[#4a90a4] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#666666] flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: {project.deadline}
                  </span>
                  <button className="text-[#4a90a4] hover:text-[#2c3e50] text-sm font-medium">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#ffffff] border border-[#e8e6e3] rounded-3xl p-8">
          <h3 className="text-xl font-semibold text-[#1a1a1a] mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {professionalActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-[#f4f3f0] last:border-b-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === "message"
                      ? "bg-[#4a90a4]/10 text-[#4a90a4]"
                      : item.type === "payment"
                      ? "bg-[#7ba05b]/10 text-[#7ba05b]"
                      : item.type === "interview"
                      ? "bg-[#c8956d]/10 text-[#c8956d]"
                      : "bg-[#f4f3f0] text-[#666666]"
                  }`}
                >
                  {item.type === "message" && <MessageSquare className="w-4 h-4" />}
                  {item.type === "payment" && <DollarSign className="w-4 h-4" />}
                  {item.type === "interview" && <Calendar className="w-4 h-4" />}
                  {item.type === "application" && <CheckCircle className="w-4 h-4" />}
                  {item.type === "profile" && <User className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[#1a1a1a] mb-1">{item.title}</div>
                  <div className="text-xs text-[#666666]">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanyDashboard = (): JSX.Element => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {companyStats.map((stat) => (
          <div
            key={stat.id}
            className="bg-[#ffffff] border border-[#e8e6e3] rounded-3xl p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-semibold text-[#1a1a1a]">{stat.value}</div>
              {getTrendIcon(stat.trend)}
            </div>
            <div className="text-sm text-[#666666] mb-1">{stat.label}</div>
            {stat.change ? (
              <div
                className={`text-xs ${
                  stat.trend === "up"
                    ? "text-[#7ba05b]"
                    : stat.trend === "down"
                    ? "text-[#c8956d]"
                    : "text-[#666666]"
                }`}
              >
                {stat.change}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Job Postings */}
        <div className="lg:col-span-2 bg-[#ffffff] border border-[#e8e6e3] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#1a1a1a]">Active Job Postings</h3>
            <button className="bg-[#2c3e50] text-white px-4 py-2 rounded-2xl text-sm font-medium hover:bg-[#243342] transition-colors">
              Post New Job
            </button>
          </div>
          <div className="space-y-4">
            {jobPostings.map((job) => (
              <div key={job.id} className="border border-[#e8e6e3] rounded-2xl p-6 hover:bg-[#f7f6f4] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-1">{job.title}</h4>
                    <div className="text-sm text-[#666666]">Posted {job.posted}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#4a90a4]" />
                    <span className="text-sm text-[#666666]">{job.applications} applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#7ba05b]" />
                    <span className="text-sm text-[#666666]">{job.views} views</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-[#4a90a4] hover:text-[#2c3e50] text-sm font-medium">View Applications</button>
                  <button className="text-[#666666] hover:text-[#1a1a1a] text-sm font-medium">Edit Post</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#ffffff] border border-[#e8e6e3] rounded-3xl p-8">
          <h3 className="text-xl font-semibold text-[#1a1a1a] mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {companyActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-[#f4f3f0] last:border-b-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === "application"
                      ? "bg-[#4a90a4]/10 text-[#4a90a4]"
                      : item.type === "payment"
                      ? "bg-[#7ba05b]/10 text-[#7ba05b]"
                      : item.type === "interview"
                      ? "bg-[#c8956d]/10 text-[#c8956d]"
                      : "bg-[#f4f3f0] text-[#666666]"
                  }`}
                >
                  {item.type === "application" && <Users className="w-4 h-4" />}
                  {item.type === "payment" && <DollarSign className="w-4 h-4" />}
                  {item.type === "interview" && <Calendar className="w-4 h-4" />}
                  {item.type === "profile" && <Briefcase className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[#1a1a1a] mb-1">{item.title}</div>
                  <div className="text-xs text-[#666666]">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // —— Render ——
  return (
    <div className="min-h-screen bg-[#f7f6f4] py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-2">
                {getUserTypeDisplayName(userType)} Dashboard
              </h1>
              <p className="text-[#666666]">
                Welcome back, {user.first_name ?? user.username}!{" "}
                {userType === "freelancer"
                  ? "Manage your projects and track your Nordic career journey"
                  : userType === "client"
                  ? "Manage your job postings and find exceptional Nordic talent"
                  : "Manage the platform and user activities"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                aria-label="Notifications"
                title="Notifications"
                className="w-10 h-10 bg-[#ffffff] border border-[#e8e6e3] rounded-2xl flex items-center justify-center text-[#666666] hover:text-[#1a1a1a] transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                aria-label="Settings"
                title="Settings"
                className="w-10 h-10 bg-[#ffffff] border border-[#e8e6e3] rounded-2xl flex items-center justify-center text-[#666666] hover:text-[#1a1a1a] transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Type Indicator */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#f4f3f0] text-[#666666] text-sm font-medium">
            {userType === "freelancer" ? (
              <>
                <User className="w-4 h-4 mr-2" />
                Professional Account
              </>
            ) : userType === "client" ? (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Company Account
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Administrator Account
              </>
            )}
          </div>
        </div>

        {/* Dashboard Content */}
        {userType === "freelancer"
          ? renderProfessionalDashboard()
          : userType === "client"
          ? renderCompanyDashboard()
          : renderProfessionalDashboard() /* fallback for admin */}
      </div>
    </div>
  );
};

export default Dashboard;
