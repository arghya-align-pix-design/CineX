package com.cinex.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.cinex.entity.Theatre;

public interface TheatreRepository extends JpaRepository<Theatre,Long>{

    List<Theatre> findByVendorId(Long vendorId);
    List<Theatre> findByCity(String city);

    @Modifying
    @Transactional
    @Query("DELETE FROM Theatre t WHERE t.vendor.id = :vendorId")
    void deleteByVendorId(@Param("vendorId") Long vendorId);

    long countByVendorId(Long vendorId);
}
