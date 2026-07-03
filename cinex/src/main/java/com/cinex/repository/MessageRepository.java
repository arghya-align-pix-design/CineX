package com.cinex.repository;

import com.cinex.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.recipient.id = :userId ORDER BY m.sentAt DESC")
    List<Message> findConversationsForUser(@Param("userId") Long userId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);
}
