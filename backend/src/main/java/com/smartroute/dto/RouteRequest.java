package com.smartroute.dto;

public record RouteRequest(
    double originLat,
    double originLng,
    double destLat,
    double destLng,
    String priority, // "MONEY", "MILES", "TIME", "BALANCED"
    double vehicleMpg,
    double gasPricePerGallon
) {}
