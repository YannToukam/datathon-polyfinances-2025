// DescriptionSection.jsx
import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import "../styles/DescriptionSection.css";



const DescriptionSection = ({ variations }) => {
  // Example fallback data
  const mockData = [
    {
      ticker: "TSLA",
      variation: +2.3,
      reason: "Subsidies for EV manufacturers increase Tesla’s market outlook.",
    },
    {
      ticker: "XOM",
      variation: -1.1,
      reason: "New carbon regulations pressure oil producers' margins.",
    },
    {
      ticker: "AAPL",
      variation: +0.8,
      reason: "Strong Q4 demand and favorable export policies.",
    },
  ];

  const data = variations?.length ? variations : mockData;

  return (
    <div className="description-section">
      <h2 className="section-title">Market Impact Analysis</h2>

      {data.map((item, index) => (
        <div key={index} className="stock-row">
          <div className="stock-info">
            <span className="ticker">{item.ticker}</span>
            <span
              className={`variation ${
                item.variation >= 0 ? "positive" : "negative"
              }`}
            >
              {item.variation >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(item.variation).toFixed(2)}%
            </span>
          </div>
          <p className="reason">{item.reason}</p>
        </div>
      ))}

      <div className="summary">
        <h3>Summary</h3>
        <p>
          Renewable energy and tech sectors show resilience following new
          sustainability legislation. Fossil fuel sectors face moderate downside
          pressure due to carbon taxation.
        </p>
      </div>
    </div>
  );
};

export default DescriptionSection;
