package com.capstone.deepterview.domain.review.repository;

import com.capstone.deepterview.domain.review.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("select r from Review r join fetch r.author order by r.createdAt desc")
    Page<Review> findAllWithAuthor(Pageable pageable);
}
