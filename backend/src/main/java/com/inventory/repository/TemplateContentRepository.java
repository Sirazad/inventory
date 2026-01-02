package com.inventory.repository;

import com.inventory.entity.TemplateContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateContentRepository extends JpaRepository<TemplateContent, Long> {
    
    List<TemplateContent> findByTemplateId(Long templateId);
    
    @Query("SELECT COUNT(tc) > 0 FROM TemplateContent tc WHERE tc.referencedTemplate.id = :templateId")
    boolean isTemplateReferenced(@Param("templateId") Long templateId);
    
    void deleteByTemplateId(Long templateId);
}
