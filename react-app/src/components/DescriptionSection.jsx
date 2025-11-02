// DescriptionSection.jsx
import React, { useState } from "react";
import { FaArrowUp, FaArrowDown, FaSearch } from "react-icons/fa";
import "../styles/DescriptionSection.css";

const DescriptionSection = ({ variations }) => {
  const mockData = [
    { ticker: "TSLA", variation: +2.3, reason: "Subsidies for EV manufacturers increase Tesla’s market outlook." },
    { ticker: "XOM", variation: -1.1, reason: "New carbon regulations pressure oil producers' margins." },
    { ticker: "AAPL", variation: +0.8, reason: "Strong Q4 demand and favorable export policies." },
    { ticker: "AMZN", variation: +1.2, reason: "E-commerce spending rises following tax relief in key regions." },
  ];

  const data = variations?.length ? variations : mockData;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((item) =>
    item.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="description-section">
      {/* --- FIXED HEADER --- */}
      <div className="description-header">
        <h2 className="section-title">Market Impact Analysis</h2>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search company (ex: TSLA)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* --- SCROLLABLE BODY --- */}
      <div className="description-scroll">
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <div key={index} className="stock-row">
              <div className="stock-info">
                <span className="ticker">{item.ticker}</span>
                <span className={`variation ${item.variation >= 0 ? "positive" : "negative"}`}>
                  {item.variation >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  {Math.abs(item.variation).toFixed(2)}%
                </span>
              </div>
              <p className="reason">{item.reason}</p>
            </div>
          ))
        ) : (
          <p className="no-results">No results found.</p>
        )}

        <div className="summary">
          <h3>Summary</h3>
          <p>
            Renewable energy and tech sectors show resilience following new
            sustainability legislation. Fossil fuel sectors face moderate
            downside pressure due to carbon taxation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DescriptionSection;
