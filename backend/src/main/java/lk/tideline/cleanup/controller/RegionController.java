package lk.tideline.cleanup.controller;

import lk.tideline.cleanup.dto.RegionDtos.DistrictResponse;
import lk.tideline.cleanup.dto.RegionDtos.ProvinceResponse;
import lk.tideline.cleanup.service.RegionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REQ-59 - the province and district reference data seeded by migration V3, so region filters
 * come from the database rather than a hard-coded list in the client.
 */
@RestController
@RequestMapping("/api/regions")
public class RegionController {

    private final RegionService regions;

    public RegionController(RegionService regions) {
        this.regions = regions;
    }

    @GetMapping("/provinces")
    public List<ProvinceResponse> provinces() {
        return regions.allProvinces();
    }

    @GetMapping("/districts")
    public List<DistrictResponse> districts() {
        return regions.allDistricts();
    }
}
