/**
 * Body Diagram — SVG visualization of body with interactive, clickable measurement regions.
 * Accessible: includes title, description, and role="img".
 */

"use client";

import React from "react";

interface BodyDiagramProps {
  highlightedPart: "chest" | "waist" | "hip" | "shoulder" | "armLength" | "length" | null;
  onRegionClick?: (part: "chest" | "waist" | "hip" | "shoulder" | "armLength" | "length") => void;
}

export default function BodyDiagram({ highlightedPart, onRegionClick }: BodyDiagramProps) {
  // Highlight color mapping
  const getStroke = (part: string) => {
    return highlightedPart === part ? "#FBBF24" : "#D1D5DB";
  };

  const getStrokeWidth = (part: string) => {
    return highlightedPart === part ? 4 : 2;
  };

  const handleClick = (part: "chest" | "waist" | "hip" | "shoulder" | "armLength" | "length") => {
    onRegionClick?.(part);
  };

  return (
    <svg
      viewBox="0 0 100 200"
      className="h-64 w-48 cursor-pointer"
      role="img"
      aria-label="Interactive body diagram for measuring"
    >
      <title>Body Measurement Guide</title>
      <desc>
        Interactive diagram showing where to measure your body. Click on any body part to focus
        that measurement field. Highlighted areas show which measurement is currently being entered.
      </desc>

      {/* Head */}
      <circle cx="50" cy="20" r="8" fill="none" stroke={getStroke("head")} strokeWidth="1" />

      {/* Shoulders - clickable */}
      <g
        onClick={() => handleClick("shoulder")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Shoulder measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("shoulder");
          }
        }}
      >
        <line
          x1="30"
          y1="32"
          x2="70"
          y2="32"
          stroke={getStroke("shoulder")}
          strokeWidth={getStrokeWidth("shoulder")}
          strokeLinecap="round"
        />
        {/* Invisible larger hit area for easier clicking */}
        <line
          x1="30"
          y1="32"
          x2="70"
          y2="32"
          stroke="transparent"
          strokeWidth="8"
        />
      </g>

      {/* Chest - clickable */}
      <g
        onClick={() => handleClick("chest")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Chest measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("chest");
          }
        }}
      >
        <ellipse
          cx="50"
          cy="50"
          rx="20"
          ry="15"
          fill="none"
          stroke={getStroke("chest")}
          strokeWidth={getStrokeWidth("chest")}
        />
        {/* Invisible larger hit area */}
        <ellipse
          cx="50"
          cy="50"
          rx="22"
          ry="17"
          fill="none"
          stroke="transparent"
          strokeWidth="4"
        />
      </g>

      {/* Left Arm - clickable */}
      <g
        onClick={() => handleClick("armLength")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Left arm length measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("armLength");
          }
        }}
      >
        <line
          x1="30"
          y1="32"
          x2="15"
          y2="70"
          stroke={getStroke("armLength")}
          strokeWidth={getStrokeWidth("armLength")}
          strokeLinecap="round"
        />
        {/* Invisible larger hit area */}
        <line
          x1="30"
          y1="32"
          x2="15"
          y2="70"
          stroke="transparent"
          strokeWidth="6"
        />
      </g>

      {/* Right Arm - clickable */}
      <g
        onClick={() => handleClick("armLength")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Right arm length measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("armLength");
          }
        }}
      >
        <line
          x1="70"
          y1="32"
          x2="85"
          y2="70"
          stroke={getStroke("armLength")}
          strokeWidth={getStrokeWidth("armLength")}
          strokeLinecap="round"
        />
        {/* Invisible larger hit area */}
        <line
          x1="70"
          y1="32"
          x2="85"
          y2="70"
          stroke="transparent"
          strokeWidth="6"
        />
      </g>

      {/* Waist - clickable */}
      <g
        onClick={() => handleClick("waist")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Waist measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("waist");
          }
        }}
      >
        <ellipse
          cx="50"
          cy="80"
          rx="16"
          ry="12"
          fill="none"
          stroke={getStroke("waist")}
          strokeWidth={getStrokeWidth("waist")}
        />
        {/* Invisible larger hit area */}
        <ellipse
          cx="50"
          cy="80"
          rx="18"
          ry="14"
          fill="none"
          stroke="transparent"
          strokeWidth="4"
        />
      </g>

      {/* Hip - clickable */}
      <g
        onClick={() => handleClick("hip")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Hip measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("hip");
          }
        }}
      >
        <ellipse
          cx="50"
          cy="120"
          rx="20"
          ry="16"
          fill="none"
          stroke={getStroke("hip")}
          strokeWidth={getStrokeWidth("hip")}
        />
        {/* Invisible larger hit area */}
        <ellipse
          cx="50"
          cy="120"
          rx="22"
          ry="18"
          fill="none"
          stroke="transparent"
          strokeWidth="4"
        />
      </g>

      {/* Legs / Length indicator - clickable */}
      <g
        onClick={() => handleClick("length")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Full length measurement"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick("length");
          }
        }}
      >
        <line
          x1="45"
          y1="136"
          x2="45"
          y2="190"
          stroke={getStroke("length")}
          strokeWidth={getStrokeWidth("length")}
          strokeLinecap="round"
          strokeDasharray={highlightedPart === "length" ? "0" : "2,2"}
        />

        <line
          x1="55"
          y1="136"
          x2="55"
          y2="190"
          stroke={getStroke("length")}
          strokeWidth={getStrokeWidth("length")}
          strokeLinecap="round"
          strokeDasharray={highlightedPart === "length" ? "0" : "2,2"}
        />

        {/* Invisible larger hit area for legs */}
        <rect
          x="40"
          y="130"
          width="20"
          height="65"
          fill="transparent"
          pointerEvents="all"
        />

        {/* Feet */}
        <circle cx="45" cy="195" r="3" fill={getStroke("length")} />
        <circle cx="55" cy="195" r="3" fill={getStroke("length")} />
      </g>
    </svg>
  );
}
