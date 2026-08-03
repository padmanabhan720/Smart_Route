package com.smartroute.service;

import com.google.maps.model.DirectionsLeg;
import com.google.maps.model.DirectionsRoute;
import com.smartroute.dto.RouteOption;
import com.smartroute.dto.RouteOption.RouteStep;
import com.smartroute.dto.RouteRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
public class RouteOptimizerService {

    private final GoogleMapsService googleMapsService;

    public RouteOptimizerService(GoogleMapsService googleMapsService) {
        this.googleMapsService = googleMapsService;
    }

    public List<RouteOption> evaluateRoutes(RouteRequest request) {
        DirectionsRoute[] routes = googleMapsService.fetchRoutes(
                request.originLat(),
                request.originLng(),
                request.destLat(),
                request.destLng()
        );

        List<RouteOption> calculatedOptions = new ArrayList<>();

        for (DirectionsRoute route : routes) {
            DirectionsLeg leg = route.legs[0];

            double miles = leg.distance.inMeters * 0.000621371;
            double durationMinutes = leg.duration.inSeconds / 60.0;
            double tollCost = 0.0; 

            double fuelCost = (miles / request.vehicleMpg()) * request.gasPricePerGallon();
            double score = calculateTradeoffScore(
                    request.priority(),
                    fuelCost,
                    tollCost,
                    durationMinutes / 60.0,
                    miles
            );

            List<RouteStep> steps = Arrays.stream(leg.steps)
                    .map(step -> new RouteStep(
                            step.htmlInstructions,
                            step.distance.humanReadable,
                            step.duration.humanReadable
                    ))
                    .toList();

            calculatedOptions.add(new RouteOption(
                    route.summary != null && !route.summary.isBlank() ? route.summary : "Route via " + leg.startAddress,
                    round(miles),
                    round(durationMinutes),
                    round(fuelCost),
                    round(tollCost),
                    round(score),
                    false,
                    route.overviewPolyline.getEncodedPath(),
                    steps
            ));
        }

        calculatedOptions.sort(Comparator.comparingDouble(RouteOption::totalCalculatedCost));

        if (!calculatedOptions.isEmpty()) {
            RouteOption top = calculatedOptions.get(0);
            calculatedOptions.set(0, new RouteOption(
                    top.summary(), top.distanceMiles(), top.durationMinutes(),
                    top.fuelCost(), top.tollCost(), top.totalCalculatedCost(), true,
                    top.encodedPolyline(), top.steps()
            ));
        }

        return calculatedOptions;
    }

    private double calculateTradeoffScore(String priority, double fuel, double tolls, double hours, double miles) {
        return switch (priority != null ? priority.toUpperCase() : "BALANCED") {
            case "MONEY" -> (fuel + tolls) + (hours * 4.0);
            case "MILES" -> (miles * 1.5) + fuel + tolls;
            case "TIME"  -> (hours * 25.0) + fuel + tolls;
            default      -> (fuel + tolls) + (hours * 12.0);
        };
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
