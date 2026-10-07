package lk.tideline.cleanup.service;

import lk.tideline.cleanup.dto.RegionDtos.DistrictResponse;
import lk.tideline.cleanup.dto.RegionDtos.ProvinceResponse;
import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.District;
import lk.tideline.cleanup.model.PollutionReport;
import lk.tideline.cleanup.model.Province;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.repository.DistrictRepository;
import lk.tideline.cleanup.repository.ProvinceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * REQ-58 / REQ-59 — resolves the free-text province and location the app already collects onto
 * the seeded province and district rows, so region analytics can join instead of grouping on
 * text. Text that matches nothing simply leaves the key null; nothing fails because of it.
 */
@Service
public class RegionService {

    private final ProvinceRepository provinces;
    private final DistrictRepository districts;

    public RegionService(ProvinceRepository provinces, DistrictRepository districts) {
        this.provinces = provinces;
        this.districts = districts;
    }

    /**
     * Mapped to DTOs inside the transaction: open-in-view is off, so a district's lazy province
     * proxy cannot be read once the session has closed.
     */
    @Transactional(readOnly = true)
    public List<ProvinceResponse> allProvinces() {
        return provinces.findAllByOrderByNameAsc().stream().map(ProvinceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<DistrictResponse> allDistricts() {
        return districts.findAllByOrderByNameAsc().stream().map(DistrictResponse::from).toList();
    }

    public Province province(String name) {
        return name == null || name.isBlank() ? null : provinces.findByNameIgnoreCase(name.trim()).orElse(null);
    }

    /** location_name is usually the district ("Trincomalee", "Galle"), so it is worth a lookup. */
    public District district(String name) {
        return name == null || name.isBlank() ? null : districts.findByNameIgnoreCase(name.trim()).orElse(null);
    }

    public void apply(PollutionReport report) {
        report.setProvinceRef(province(report.getProvince()));
        report.setDistrict(district(report.getLocationName()));
    }

    public void apply(CleanupProject project) {
        project.setProvinceRef(province(project.getProvince()));
    }

    public void apply(User user) {
        user.setProvinceRef(province(user.getProvince()));
    }
}
