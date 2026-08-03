package com.smartroute.controller;

import com.smartroute.dto.RouteOption;
import com.smartroute.dto.RouteRequest;
import com.smartroute.service.RouteOptimizerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteController {

    private final RouteOptimizerService optimizerService;

    public RouteController(RouteOptimizerService optimizerService) {
        this.optimizerService = optimizerService;
    }

    @PostMapping("/optimize")
    public List<RouteOption> optimizeRoute(@RequestBody RouteRequest request) {
        return optimizerService.evaluateRoutes(request);
    }
}
