package com.capstone.deepterview.domain.review.repository;

import com.capstone.deepterview.domain.review.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByReviewIdAndParentIsNullOrderByCreatedAtAsc(Long reviewId);

    List<Comment> findByReviewIdOrderByCreatedAtAsc(Long reviewId);
}
