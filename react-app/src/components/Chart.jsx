// PieChart.jsx
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "../styles/DescriptionSection.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  const data = {
    labels: ["Tech", "Energy", "Finance", "Healthcare"],
    datasets: [
      {
        data: [40, 25, 20, 15],
        backgroundColor: [
          "#4B9CE2",
          "#34D399",
          "#FBBF24",
          "#F87171"
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#fff",
          font: { size: 14 },
        },
      },
    },
    responsive: true,
  };

  return (
    <div style={{ width: "500px" }}>
      <h3 className="portfolio">Portfolio Distribution</h3>
      <Pie data={data} options={options} />
    </div>

  );
};

export default PieChart;