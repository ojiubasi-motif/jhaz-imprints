/**
 * Body Diagram — SVG visualization of body with highlighted measurement regions.
 * Accessible: includes title, description, and role="img".
 */

"use client";

import React from "react";

interface BodyDiagramProps {
  highlightedPart: "chest" | "waist" | "hip" | "shoulder" | "armLength" | "length" | null;
}

export default function BodyDiagram({ highlightedPart }: BodyDiagramProps) {
  // Highlight color mapping
  const getStroke = (part: string) => {
    return highlightedPart === part ? "#FBBF24" : "#D1D5DB";
  };

  const getStrokeWidth = (part: string) => {
    return highlightedPart === part ? 3 : 2;
  };

  return (
    <svg
      viewBox="0 0 100 200"
      className="h-64 w-48"
      role="img"
      aria-label="Body diagram for measuring"
    >
      <title>Body Measurement Guide</title>
      <desc>
        Interactive diagram showing where to measure your body. Highlighted areas show which
        measurement is currently being entered.
      </desc>

      {/* Head */}
      <circle cx="50" cy="20" r="8" fill="none" stroke={getStroke("head")} strokeWidth="1" />

      {/* Shoulders */}
      <line
        x1="30"
        y1="32"
        x2="70"
        y2="32"
        stroke={getStroke("shoulder")}
        strokeWidth={getStrokeWidth("shoulder")}
        strokeLinecap="round"
      />

      {/* Chest */}
      <ellipse
        cx="50"
        cy="50"
        rx="20"
        ry="15"
        fill="none"
        stroke={getStroke("chest")}
        strokeWidth={getStrokeWidth("chest")}
      />

      {/* Left Arm */}
      <line
        x1="30"
        y1="32"
        x2="15"
        y2="70"
        stroke={getStroke("armLength")}
        strokeWidth={getStrokeWidth("armLength")}
        strokeLinecap="round"
      />

      {/* Right Arm */}
      <line
        x1="70"
        y1="32"
        x2="85"
        y2="70"
        stroke={getStroke("armLength")}
        strokeWidth={getStrokeWidth("armLength")}
        strokeLinecap="round"
      />

      {/* Waist */}
      <ellipse
        cx="50"
        cy="80"
        rx="16"
        ry="12"
        fill="none"
        stroke={getStroke("waist")}
        strokeWidth={getStrokeWidth("waist")}
      />

      {/* Hip */}
      <ellipse
        cx="50"
        cy="120"
        rx="20"
        ry="16"
        fill="none"
        stroke={getStroke("hip")}
        strokeWidth={getStrokeWidth("hip")}
      />

      {/* Legs / Length indicator */}
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

      {/* Feet */}
      <circle cx="45" cy="195" r="3" fill={getStroke("length")} />
      <circle cx="55" cy="195" r="3" fill={getStroke("length")} />
    </svg>
  );
}
