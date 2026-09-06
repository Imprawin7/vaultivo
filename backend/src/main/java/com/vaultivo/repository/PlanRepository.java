package com.vaultivo.repository;

import com.vaultivo.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {

    List<Plan> findAllByOrderByQuotaBytesAsc();

    boolean existsByName(String name);
}
