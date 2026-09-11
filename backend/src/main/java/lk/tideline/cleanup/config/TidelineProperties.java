package lk.tideline.cleanup.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "tideline")
@Getter
@Setter
public class TidelineProperties {

    private Verification verification = new Verification();
    private Alerts alerts = new Alerts();
    private Security security = new Security();
    private Cors cors = new Cors();
    private boolean seedDemoData = false;

    @Getter
    @Setter
    public static class Verification {
        private int thresholdPercent = 75;
        private int minimumVotes = 5;
    }

    @Getter
    @Setter
    public static class Alerts {
        private double initialRadiusKm = 5;
        private List<Double> escalationRadiiKm = List.of(25.0, 100.0, 500.0);
    }

    @Getter
    @Setter
    public static class Security {
        private String jwtSecret;
        private long jwtExpiryMinutes = 720;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");
    }
}
