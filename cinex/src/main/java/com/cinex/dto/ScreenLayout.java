package com.cinex.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

/**
 * JSONB-mappable DTO representing the entire visual seat map for a Screen.
 * Stored as a single JSONB column on the Screen entity.
 *
 * Design: Each row belongs to exactly one zone (Gold, Silver, etc.).
 * Zones are painted onto rows — not stored as separate DB records.
 * Individual seats can be marked REMOVED to create irregular layouts.
 */
@Data
public class ScreenLayout {

    private List<LayoutRow> rows = new ArrayList<>();
    private List<Zone> zones = new ArrayList<>();
    private AisleConfig aisles = new AisleConfig();
    private LayoutMeta meta = new LayoutMeta();

    // ── Nested: A single row of seats ──
    @Data
    public static class LayoutRow {
        private String rowLabel;       // "A", "B", ... "AA", "AB"
        private int rowOrder;          // 0-indexed position in the grid
        private String zone;           // matches Zone.type — e.g. "GOLD"
        private List<LayoutSeat> seats = new ArrayList<>();
    }

    // ── Nested: A single seat within a row ──
    @Data
    public static class LayoutSeat {
        private int col;               // 1-indexed column position
        private String code;           // e.g. "A5" — unique within the screen
        private String status;         // "ACTIVE" or "REMOVED"
    }

    // ── Nested: A pricing/visual zone ──
    @Data
    public static class Zone {
        private String name;           // Display name: "Gold Section"
        private String type;           // Enum-like key: "GOLD", "SILVER", etc.
        private double priceMultiplier; // e.g. 1.5
        private String color;          // Hex color for UI: "#C4A140"
    }

    // ── Nested: Aisle configuration ──
    @Data
    public static class AisleConfig {
        private List<Integer> afterRows = new ArrayList<>();  // row gaps (e.g. gap after row index 3)
        private List<Integer> afterCols = new ArrayList<>();  // column gaps (e.g. gap after col 5)
    }

    // ── Nested: Layout metadata ──
    @Data
    public static class LayoutMeta {
        private int maxCols;
        private int rowGap = 10;       // default visual spacing
        private int colGap = 6;
        private int totalActiveSeats;
    }
}
