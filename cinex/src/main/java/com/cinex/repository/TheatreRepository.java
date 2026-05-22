package com.cinex.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinex.entity.Theatre;

public interface TheatreRepository extends JpaRepository<Theatre,Long>{

    List<Theatre> findByVendorId(Long vendorId);
    List<Theatre> findByCity(String city);
   //List<Theatre> findByState(String state);

}
