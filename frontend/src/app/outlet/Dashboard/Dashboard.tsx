import React from "react";

type Stat = { id: string; label: string; value: string };

export const Dashboard: React.FC = () => {
    const stats: Stat[] = [
        { id: "1", label: "Users", value: "1,234" },
        { id: "2", label: "Active", value: "873" },
        { id: "3", label: "Sales", value: "$12.4k" },
        { id: "4", label: "Errors", value: "3" },
    ];

    const recent = [
        { id: "a", title: "User signed up", time: "2h ago" },
        { id: "b", title: "Order #324 processed", time: "4h ago" },
        { id: "c", title: "Payment failed", time: "1d ago" },
    ];

    return (
        <main style={styles.container}>
            <header style={styles.header}>
                <h1 style={{ margin: 0, fontSize: 20 }}>Dashboard</h1>
                <small style={{ color: "#666" }}>Overview & recent activity</small>
            </header>

            <section style={styles.statsGrid}>
                {stats.map((s) => (
                    <div key={s.id} style={styles.card}>
                        <div style={styles.cardValue}>{s.value}</div>
                        <div style={styles.cardLabel}>{s.label}</div>
                    </div>
                ))}
            </section>

            <section style={styles.mainRow}>
                <div style={styles.chartCard}>
                    <h3 style={styles.sectionTitle}>Traffic (last 7 days)</h3>
                    <div style={styles.chart}>
                        {/* simple placeholder sparkline */}
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.bar,
                                    height: `${30 + (i % 5) * 10}px`,
                                    background: `hsl(${200 + i * 8}deg 60% 55%)`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div style={styles.activityCard}>
                    <h3 style={styles.sectionTitle}>Recent activity</h3>
                    <ul style={styles.list}>
                        {recent.map((r) => (
                            <li key={r.id} style={styles.listItem}>
                                <div>{r.title}</div>
                                <small style={{ color: "#888" }}>{r.time}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </main>
    );
};

const styles: { [k: string]: React.CSSProperties } = {
    container: {
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
        color: "#222",
    },
    header: { marginBottom: 16 },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 16,
    },
    card: {
        background: "#fff",
        borderRadius: 8,
        padding: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    },
    cardValue: { fontSize: 18, fontWeight: 600 },
    cardLabel: { fontSize: 12, color: "#666", marginTop: 6 },

    mainRow: { display: "flex", gap: 12, alignItems: "flex-start" },
    chartCard: {
        flex: 2,
        background: "#fff",
        borderRadius: 8,
        padding: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    },
    activityCard: {
        flex: 1,
        background: "#fff",
        borderRadius: 8,
        padding: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    },
    sectionTitle: { margin: "0 0 8px 0", fontSize: 14 },
    chart: { display: "flex", alignItems: "end", gap: 6, height: 80, padding: "6px 0" },
    bar: { width: 12, borderRadius: 4 },
    list: { listStyle: "none", padding: 0, margin: 0 },
    listItem: { padding: "8px 0", borderBottom: "1px solid #f0f0f0" },
};

export default Dashboard;
