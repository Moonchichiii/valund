import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return <div className="dashboard-layout">{children}</div>;
};

export default DashboardLayout;
