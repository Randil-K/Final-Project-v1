package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {

    Optional<District> findByNameIgnoreCase(String name);

    List<District> findByProvinceIdOrderByNameAsc(Long provinceId);

    List<District> findAllByOrderByNameAsc();
}
