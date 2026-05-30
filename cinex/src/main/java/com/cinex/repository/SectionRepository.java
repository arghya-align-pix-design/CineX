package com.cinex.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinex.entity.Section;
//@Repository
public interface SectionRepository extends JpaRepository<Section, Long> 
{
    //private EntityManager entityManager;

    // public List<Theater> findTheatersById(Long theaterId) {
    //     String jpql = "SELECT t FROM Theater t WHERE t.id = :theaterId";
    //     return entityManager.createQuery(jpql, Theater.class)
    //             .setParameter("theaterId", theaterId)
    //             .getResultList();
    // }
    
    List<Section> findByTheatreId(Long theatreId);
    // @Query("select s from Section s WHERE s.theatre.id = ?1")
    // List<Section> findByTheatreId(Long theatreId);

    
    List<Section> findByTheatreIdAndIsActiveTrue(Long theatreId);
    // @Query("SELECT s FROM Section s WHERE s.theatre.id = :theatreId AND s.isActive = true)")
    // List<Section> findByTheatreIdAndIsActiveTrue(Long theatreId);
    // public List<Section> findTheatreByIdAndIsActive(Long theatreId, boolean isActive ){
    //     String jpql = "SELECT s FROM Section s WHERE s.theatre.id = :theatreId AND s.isActive = :isActive";
    //     return entityManager.createQuery(jpql, Section.class)
    //             .setParameter("theatreId", theatreId)
    //             .setParameter("isActive", isActive)
    //             .getResultList();
    // }
    
    boolean existsByTheatreIdAndName(Long theatreId, String name);
    // @Query("SELECT COUNT(s) FROM Section s WHERE s.theatre.id = :theatreId AND s.name = :name")
    // boolean existsByTheatreIdAndName(Long theatreId, String name);
    // public boolean existsByTheatreIdAndName(Long theatreId, String name){
    // String jpql = "SELECT COUNT(s) FROM Section s WHERE s.theatre.id = :theatreId AND s.name = :name";
    // Long count = entityManager.createQuery(jpql, Long.class)
    //         .setParameter("theatreId", theatreId)
    //         .setParameter("name", name)
    //         .getSingleResult();
    // return count > 0;
    // }
}
