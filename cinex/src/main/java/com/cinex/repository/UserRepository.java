package com.cinex.repository;

import com.cinex.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(User.Role role);
    long countByRole(User.Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isApproved = true")
    long countByRoleAndApprovedTrue(@Param("role") User.Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isApproved = false")
    long countByRoleAndApprovedFalse(@Param("role") User.Role role);
}