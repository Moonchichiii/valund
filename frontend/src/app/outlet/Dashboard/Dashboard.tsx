import type React from "react";

interface Stat {
  id: string;
  label: string;
  value: string;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
}

export const Dashboard = (): React.JSX.Element => {
  const stats: Stat[] = [
    { id: "1", label: "Users", value: "1,234" },
    { id: "2", label: "Active", value: "873" },
    { id: "3", label: "Sales", value: "$12.4k" },
    { id: "4", label: "Errors", value: "3" },
  ];

  const recent: RecentActivity[] = [
    { id: "a", title: "User signed up", time: "2h ago" },
    { id: "b", title: "Order #324 processed", time: "4h ago" },
    { id: "c", title: "Payment failed", time: "1d ago" },
  ];

  return (
    <main className="p-5 font-inter text-text-primary">
      <header className="mb-4">
        <h1 className="m-0 text-xl font-semibold">Dashboard</h1>
        <small className="text-text-secondary">Overview & recent activity</small>
      </header>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-nordic-white rounded-nordic p-3 shadow-nordic-sm"
          >
            <div className="text-lg font-semibold">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-1.5">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="flex gap-3 items-start">
        <div className="flex-[2] bg-nordic-white rounded-nordic p-3 shadow-nordic-sm">
          <h3 className="m-0 mb-2 text-sm font-medium">Traffic (last 7 days)</h3>
          <div className="flex items-end gap-1.5 h-20 py-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const height = 30 + (i % 5) * 10;
              const hue = 200 + i * 8;
              return (
                <div
                  key={`chart-bar-${i}`}
                  className="w-3 rounded"
                  style={{
                    height: height.toString() + 'px',
                    backgroundColor: 'hsl(' + hue.toString() + 'deg 60% 55%)',
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-nordic-white rounded-nordic p-3 shadow-nordic-sm">
          <h3 className="m-0 mb-2 text-sm font-medium">Recent activity</h3>
          <ul className="list-none p-0 m-0">
            {recent.map((item) => (
              <li
                key={item.id}
                className="py-2 border-b border-border-light last:border-b-0"
              >
                <div className="text-sm">{item.title}</div>
                <small className="text-text-muted">{item.time}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
