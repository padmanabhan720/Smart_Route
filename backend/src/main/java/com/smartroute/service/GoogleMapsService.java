package com.smartroute.service;

import com.google.maps.DirectionsApi;
import com.google.maps.GeoApiContext;
import com.google.maps.model.DirectionsResult;
import com.google.maps.model.DirectionsRoute;
import com.google.maps.model.LatLng;
import com.google.maps.model.TravelMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
public class GoogleMapsService {

    @Value("${google.maps.api-key}")
    private String apiKey;    

    private GeoApiContext context;

    @PostConstruct
    public void init() {
        this.context = new GeoApiContext.Builder()
                .apiKey(apiKey)
                .build();
    }

    @PreDestroy
    public void shutdown() {
        if (context != null) {
            context.shutdown();
        }
    }

    public DirectionsRoute[] fetchRoutes(double originLat, double originLng, double destLat, double destLng) {
        try {
            LatLng origin = new LatLng(originLat, originLng);
            LatLng destination = new LatLng(destLat, destLng);

            DirectionsResult result = DirectionsApi.newRequest(context)
                    .mode(TravelMode.DRIVING)
                    .origin(origin)
                    .destination(destination)
                    .alternatives(true)
                    .await();

            return result.routes;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch routes from Google Maps API: " + e.getMessage(), e);
        }
    }
}
