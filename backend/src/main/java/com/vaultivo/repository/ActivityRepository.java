package com.vaultivo.repository;

import com.vaultivo.model.Activity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    List<Activity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Activity> findByActorIdOrderByCreatedAtDesc(UUID actorId, Pageable pageable);
}
