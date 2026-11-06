// ============================================================================
// AWITEN.ai — Continuous-Time Freshness Trajectory F(t) & Canopy Thermal Chart
// Styled for the Botanical-Green Gradient Light Theme
// ============================================================================

let chart = null;

const defaultHoursLabels = [
    "0h (La Trinidad)",
    "1h",
    "2h (Buguias)",
    "3h",
    "4h",
    "4.5h (Tarlac)",
    "6h",
    "7h (Bulacan)",
    "8.5h",
    "10h (NLEX)",
    "11.5h",
    "13h (Manila)"
];

function initChart() {
    const canvas = document.getElementById("freshnessChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: defaultHoursLabels,
            datasets: [
                {
                    label: "AWITEN Freshness Score F(t)",
                    data: [96.0, 91.5, 86.0, 78.5, 69.0, 62.4, 54.0, 48.0, 41.0, 35.0, 29.0, 24.0],
                    borderColor: "#0b6e3b",
                    backgroundColor: "rgba(22, 163, 74, 0.14)",
                    fill: true,
                    tension: 0.36,
                    pointRadius: 4,
                    pointBackgroundColor: "#0b6e3b",
                    borderWidth: 3
                },
                {
                    label: "Canopy Temp (°C)",
                    data: [17.5, 19.2, 21.8, 26.4, 31.2, 34.2, 35.1, 35.6, 36.0, 36.3, 36.5, 36.6],
                    borderColor: "#dc2626",
                    backgroundColor: "rgba(220, 38, 38, 0.06)",
                    fill: false,
                    tension: 0.36,
                    pointRadius: 3.5,
                    pointBackgroundColor: "#dc2626",
                    borderWidth: 2.5
                },
                {
                    label: "Grade 3 Minimum Floor (F = 50)",
                    data: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
                    borderColor: "#f5821f",
                    borderDash: [6, 6],
                    pointRadius: 0,
                    fill: false,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#053d22",
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 12,
                            weight: "700"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(5, 61, 34, 0.95)",
                    titleColor: "#ffffff",
                    bodyColor: "#dcfce7",
                    borderColor: "rgba(22, 163, 74, 0.4)",
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#334e40",
                        maxRotation: 25,
                        minRotation: 0,
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 11,
                            weight: "600"
                        }
                    },
                    grid: {
                        color: "rgba(5, 61, 34, 0.07)"
                    }
                },
                y: {
                    min: 0,
                    max: 105,
                    ticks: {
                        color: "#334e40",
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 11,
                            weight: "600"
                        }
                    },
                    grid: {
                        color: "rgba(5, 61, 34, 0.07)"
                    }
                }
            }
        }
    });
}

function updateChartData(freshnessCurve, tempCurve) {
    if (!chart) {
        initChart();
    }
    if (!chart) return;

    chart.data.datasets[0].data = freshnessCurve;
    if (tempCurve && tempCurve.length) {
        chart.data.datasets[1].data = tempCurve;
    }
    chart.update();
}

function ensureChartInitializedAndResized() {
    if (!chart) {
        initChart();
    } else {
        setTimeout(() => {
            chart.resize();
            chart.update();
        }, 60);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initChart();
});
