package com.smartroute.dto;

import java.util.List;

public record RouteOption(
    String summary,
    double distanceMiles,
    double durationMinutes,
    double fuelCost,
    double tollCost,
    double totalCalculatedCost,
    boolean isRecommended,
    String encodedPolyline,
    List<RouteStep> steps
) {
    public record RouteStep(
        String htmlInstruction,
        String distanceText,
        String durationText
    ) {}
}
