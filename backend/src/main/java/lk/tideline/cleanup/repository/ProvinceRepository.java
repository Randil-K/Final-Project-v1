package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.Province;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProvinceRepository extends JpaRepository<Province, Long> {

    Optional<Province> findByNameIgnoreCase(String name);

    List<Province> findAllByOrderByNameAsc();
}
