package lk.tideline.cleanup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.tideline.cleanup.model.ApplicationStatus;
import lk.tideline.cleanup.model.CertificationLevel;
import lk.tideline.cleanup.model.Opportunity;
import lk.tideline.cleanup.model.OpportunityApplication;
import lk.tideline.cleanup.model.OrganizationType;

import java.time.Instant;

public final class OpportunityDtos {

    private OpportunityDtos() {
    }

    public record CreateOpportunityRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 2000) String description,
            @NotBlank String region,
            CertificationLevel requiredCertification,
            boolean paid
    ) {
    }

    public record OpportunityResponse(
            Long id,
            String title,
            String description,
            String region,
            CertificationLevel requiredCertification,
            boolean paid,
            boolean open,
            Long organizationId,
            String organizationName,
            OrganizationType organizationType,
            Instant createdAt
    ) {
        public static OpportunityResponse from(Opportunity opportunity) {
            var org = opportunity.getOrganization();
            return new OpportunityResponse(
                    opportunity.getId(),
                    opportunity.getTitle(),
                    opportunity.getDescription(),
                    opportunity.getRegion(),
                    opportunity.getRequiredCertification(),
                    opportunity.isPaid(),
                    opportunity.isOpen(),
                    org.getId(),
                    org.getOrganizationName() != null ? org.getOrganizationName() : org.getFullName(),
                    org.getOrganizationType(),
                    opportunity.getCreatedAt());
        }
    }

    public record ApplyRequest(@Size(max = 1000) String message) {
    }

    public record ApplicationResponse(
            Long id,
            Long opportunityId,
            String opportunityTitle,
            UserDtos.UserSummary diver,
            ApplicationStatus status,
            String message,
            Instant createdAt
    ) {
        public static ApplicationResponse from(OpportunityApplication application) {
            return new ApplicationResponse(
                    application.getId(),
                    application.getOpportunity().getId(),
                    application.getOpportunity().getTitle(),
                    UserDtos.UserSummary.from(application.getDiver()),
                    application.getStatus(),
                    application.getMessage(),
                    application.getCreatedAt());
        }
    }

    public record DecideApplicationRequest(@NotNull ApplicationStatus status) {
    }
}
