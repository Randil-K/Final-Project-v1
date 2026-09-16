package lk.tideline.cleanup.controller;

import lk.tideline.cleanup.model.District;
import lk.tideline.cleanup.model.Province;
import lk.tideline.cleanup.service.RegionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REQ-59 — the province and district reference data seeded by migration V3, so region filters
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
        return regions.allProvinces().stream().map(ProvinceResponse::from).toList();
    }

    @GetMapping("/districts")
    public List<DistrictResponse> districts() {
        return regions.allDistricts().stream().map(DistrictResponse::from).toList();
    }

    public record ProvinceResponse(Long id, String name, String code, boolean coastal) {
        static ProvinceResponse from(Province province) {
            return new ProvinceResponse(province.getId(), province.getName(), province.getCode(), province.isCoastal());
        }
    }

    public record DistrictResponse(Long id, String name, String province, boolean coastal) {
        static DistrictResponse from(District district) {
            return new DistrictResponse(district.getId(), district.getName(),
                    district.getProvince().getName(), district.isCoastal());
        }
    }
}
