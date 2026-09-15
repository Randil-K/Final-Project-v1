package lk.tideline.cleanup.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One line of equipment an administrator assigns to a project, e.g. "Gloves", 40. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentItem {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private int quantity;
}
