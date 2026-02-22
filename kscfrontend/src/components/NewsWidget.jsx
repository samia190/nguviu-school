import React, { useEffect, useState } from "react";
import { get } from "../utils/api";
import OptimizedImage from "./OptimizedImage";

export default function NewsWidget() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    get("/api/home-news?active=true")
      .then((data) => {
        const newsList = Array.isArray(data) ? data : (data.news || []);
        setNews(newsList.slice(0, 5)); // Show top 5
      })
      .catch((err) => {
        setError("Failed to load news");
        console.error("News error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "20px", textAlign: "center", background: "#f5f5f5", borderRadius: "8px" }}>Loading news...</div>;

  if (!news || news.length === 0) return <div style={{ padding: "20px", textAlign: "center", color: "#999", background: "#f5f5f5", borderRadius: "8px" }}>No news available</div>;

  return (
    <div style={{
      background: "white",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      position: "sticky",
      top: "20px"
    }}>
      <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333", fontSize: "20px", borderBottom: "2px solid #667eea", paddingBottom: "10px" }}>
        📰 Latest News & Updates
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        {news.map((item, index) => (
          <div key={item._id} style={{
            padding: "15px",
            background: "#f9f9f9",
            borderLeft: "4px solid #667eea",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            {/* Image Container - Ensure it displays */}
            {item.imageUrl && (
              <div style={{
                width: "100%",
                height: "160px",
                overflow: "hidden",
                borderRadius: "4px",
                marginBottom: "12px",
                background: "#e0e0e0"
              }}>
                <OptimizedImage
                  src={item.imageUrl}
                  alt={item.title}
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              </div>
            )}
            
            {/* Title */}
            <h4 style={{ margin: "0 0 8px 0", color: "#2c3e50", fontSize: "14px", fontWeight: "600" }}>
              {item.title}
            </h4>
            
            {/* Description */}
            <p style={{ margin: "5px 0 10px 0", fontSize: "12px", color: "#666", lineHeight: "1.4" }}>
              {item.description?.substring(0, 80)}...
            </p>
            
            {/* Meta Info */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999", marginTop: "8px" }}>
              <span>{item.category?.toUpperCase()}</span>
              <span>👁 {item.views || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
