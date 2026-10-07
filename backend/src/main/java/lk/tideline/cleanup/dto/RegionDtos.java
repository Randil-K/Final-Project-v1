package lk.tideline.cleanup.dto;

import lk.tideline.cleanup.model.District;
import lk.tideline.cleanup.model.Province;

/** REQ-58, REQ-59 — the province and district reference data seeded by migration V3. */
public final class RegionDtos {

    private RegionDtos() {
    }

    public record ProvinceResponse(Long id, String name, String code, boolean coastal) {
        public static ProvinceResponse from(Province province) {
            return new ProvinceResponse(province.getId(), province.getName(),
                    province.getCode(), province.isCoastal());
        }
    }

    public record DistrictResponse(Long id, String name, String province, boolean coastal) {
        public static DistrictResponse from(District district) {
            return new DistrictResponse(district.getId(), district.getName(),
                    district.getProvince().getName(), district.isCoastal());
        }
    }
}
