package com.inventory.service;

import com.inventory.dto.*;
import com.inventory.entity.*;
import com.inventory.exception.InvalidOperationException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.*;
import com.inventory.util.CurrencyUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TemplateService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ItemTemplateRepository itemTemplateRepository;
    private final TemplateContentRepository templateContentRepository;
    private final CharacterRepository characterRepository;
    private final InventoryRepository inventoryRepository;
    private final PyarrCalendarService pyarrCalendarService;

    public TemplateService(ItemTemplateRepository itemTemplateRepository,
                          TemplateContentRepository templateContentRepository,
                          CharacterRepository characterRepository,
                          InventoryRepository inventoryRepository,
                          PyarrCalendarService pyarrCalendarService) {
        this.itemTemplateRepository = itemTemplateRepository;
        this.templateContentRepository = templateContentRepository;
        this.characterRepository = characterRepository;
        this.inventoryRepository = inventoryRepository;
        this.pyarrCalendarService = pyarrCalendarService;
    }

    // Search with pagination
    @Transactional(readOnly = true)
    public Page<TemplateResponse> searchTemplates(
            String name, Boolean isContainer, String category,
            int page, int size, String sortBy, String sortDir) {
        
        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDir) ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by(direction, sortBy));
        
        // Add wildcards for LIKE search
        String namePattern = (name != null && !name.isEmpty()) ? "%" + name + "%" : null;
        String categoryPattern = (category != null && !category.isEmpty()) ? "%" + category + "%" : null;
        
        Page<ItemTemplate> templates = itemTemplateRepository.searchTemplates(
            namePattern, isContainer, categoryPattern, pageable);
        
        return templates.map(this::toResponse);
    }

    // Get all with pagination
    @Transactional(readOnly = true)
    public Page<TemplateResponse> getAllTemplates(int page, int size, String sortBy, String sortDir) {
        return searchTemplates(null, null, null, page, size, sortBy, sortDir);
    }

    // Get single template with resolved contents
    @Transactional(readOnly = true)
    public TemplateResponse getTemplate(Long id) {
        ItemTemplate template = findTemplateOrThrow(id);
        return toResponseWithContents(template);
    }

    // Create template with circular reference validation
    @Transactional
    public TemplateResponse createTemplate(TemplateRequest request) {
        log.debug("Creating template: {}", request.getName());
        
        // Validate unique name
        if (itemTemplateRepository.existsByName(request.getName())) {
            throw new InvalidOperationException("Template with name '" + request.getName() + "' already exists");
        }
        
        ItemTemplate template = new ItemTemplate();
        mapRequestToEntity(request, template);
        
        ItemTemplate saved = itemTemplateRepository.save(template);
        
        if (request.getIsContainer() != null && request.getIsContainer() && 
            request.getContents() != null && !request.getContents().isEmpty()) {
            for (TemplateContentRequest contentReq : request.getContents()) {
                createTemplateContent(saved, contentReq);
            }
        }
        
        log.info("Template created: {} (ID: {})", saved.getName(), saved.getId());
        return getTemplate(saved.getId());
    }

    // Update template
    @Transactional
    public TemplateResponse updateTemplate(Long id, TemplateRequest request) {
        log.debug("Updating template ID: {}", id);
        
        ItemTemplate template = findTemplateOrThrow(id);
        
        // Check name uniqueness if changed
        if (!template.getName().equals(request.getName()) && 
            itemTemplateRepository.existsByName(request.getName())) {
            throw new InvalidOperationException("Template with name '" + request.getName() + "' already exists");
        }
        
        // Delete existing contents
        templateContentRepository.deleteByTemplateId(id);
        
        mapRequestToEntity(request, template);
        itemTemplateRepository.save(template);
        
        // Re-add contents
        if (request.getIsContainer() != null && request.getIsContainer() && 
            request.getContents() != null && !request.getContents().isEmpty()) {
            for (TemplateContentRequest contentReq : request.getContents()) {
                createTemplateContent(template, contentReq);
            }
        }
        
        log.info("Template updated: {} (ID: {})", template.getName(), id);
        return getTemplate(id);
    }

    // Delete with reference check
    @Transactional
    public void deleteTemplate(Long id) {
        log.debug("Deleting template ID: {}", id);
        
        if (templateContentRepository.isTemplateReferenced(id)) {
            throw new InvalidOperationException(
                "Cannot delete template - it is referenced by other templates");
        }
        
        ItemTemplate template = findTemplateOrThrow(id);
        String name = template.getName();
        
        itemTemplateRepository.delete(template);
        log.info("Template deleted: {} (ID: {})", name, id);
    }

    // Instantiate template to inventory with recursive resolution
    @Transactional
    public InventoryResponse addTemplateToInventory(Long characterId, Long templateId) {
        log.debug("Adding template ID {} to character ID {} inventory", templateId, characterId);
        
        com.inventory.entity.Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
        
        ItemTemplate template = findTemplateOrThrow(templateId);
        
        Inventory mainItem = createInventoryFromTemplate(template, character, null);
        Inventory savedMain = inventoryRepository.save(mainItem);
        
        if (template.getIsContainer()) {
            List<TemplateContent> contents = templateContentRepository.findByTemplateId(templateId);
            for (TemplateContent content : contents) {
                resolveAndCreateInventoryItem(content, character, savedMain, new HashSet<>());
            }
        }
        
        log.info("Template '{}' added to character ID {} inventory", template.getName(), characterId);
        return new InventoryResponse(savedMain, pyarrCalendarService);
    }

    // Private helper methods

    private void createTemplateContent(ItemTemplate template, TemplateContentRequest contentReq) {
        TemplateContent content = new TemplateContent();
        content.setTemplate(template);
        
        if (contentReq.getReferencedTemplateId() != null) {
            // Validate circular reference
            validateNoCircularReference(template.getId(), contentReq.getReferencedTemplateId());
            ItemTemplate refTemplate = findTemplateOrThrow(contentReq.getReferencedTemplateId());
            content.setReferencedTemplate(refTemplate);
            content.setQuantityOverride(contentReq.getQuantityOverride());
        } else {
            // Direct definition
            if (contentReq.getCategory() == null || contentReq.getItem() == null) {
                throw new InvalidOperationException(
                    "Template content must have either referenced_template_id OR category and item");
            }
            content.setCategory(contentReq.getCategory());
            content.setItem(contentReq.getItem());
            content.setQuality(contentReq.getQuality());
            content.setDescription(contentReq.getDescription());
            content.setPriceInCopper(CurrencyUtil.toCopperValue(
                contentReq.getGold(), contentReq.getSilver(), contentReq.getCopper()));
            content.setQuantity(contentReq.getQuantity());
            content.setWeight(contentReq.getWeight());
        }
        
        templateContentRepository.save(content);
    }

    private void resolveAndCreateInventoryItem(
            TemplateContent content, com.inventory.entity.Character character, Inventory container, Set<Long> visitedTemplates) {
        
        if (content.getReferencedTemplate() != null) {
            ItemTemplate refTemplate = content.getReferencedTemplate();
            
            // Circular reference protection
            if (visitedTemplates.contains(refTemplate.getId())) {
                throw new InvalidOperationException("Circular template reference detected during instantiation");
            }
            visitedTemplates.add(refTemplate.getId());
            
            int quantity = content.getQuantityOverride() != null ? 
                content.getQuantityOverride() : refTemplate.getQuantity();
            
            Inventory item = createInventoryFromTemplate(refTemplate, character, container);
            item.setQuantity(quantity);
            Inventory savedItem = inventoryRepository.save(item);
            
            // If referenced template is also a container, recursively resolve
            if (refTemplate.getIsContainer()) {
                List<TemplateContent> nestedContents = 
                    templateContentRepository.findByTemplateId(refTemplate.getId());
                for (TemplateContent nestedContent : nestedContents) {
                    resolveAndCreateInventoryItem(nestedContent, character, savedItem, 
                        new HashSet<>(visitedTemplates));
                }
            }
        } else {
            // Direct definition
            Inventory item = new Inventory();
            item.setCategory(content.getCategory());
            item.setItem(content.getItem());
            item.setQuality(content.getQuality());
            item.setDescription(content.getDescription());
            item.setPriceInCopper(content.getPriceInCopper());
            item.setQuantity(content.getQuantity());
            item.setWeight(content.getWeight());
            item.setCharacter(character);
            item.setContainer(container);
            item.setIsContainer(false);
            item.setAddedYear(character.getCurrentYear());
            item.setAddedDay(character.getCurrentDay());
            inventoryRepository.save(item);
        }
    }

    private Inventory createInventoryFromTemplate(ItemTemplate template, com.inventory.entity.Character character, Inventory container) {
        Inventory inventory = new Inventory();
        inventory.setCategory(template.getCategory());
        inventory.setItem(template.getItem());
        inventory.setQuality(template.getQuality());
        inventory.setDescription(template.getDescription());
        inventory.setPriceInCopper(template.getPriceInCopper());
        inventory.setQuantity(template.getQuantity());
        inventory.setWeight(template.getWeight());
        inventory.setCharacter(character);
        inventory.setContainer(container);
        inventory.setIsContainer(template.getIsContainer());
        inventory.setAddedYear(character.getCurrentYear());
        inventory.setAddedDay(character.getCurrentDay());
        return inventory;
    }

    private void validateNoCircularReference(Long templateId, Long referencedTemplateId) {
        Set<Long> visited = new HashSet<>();
        if (hasCircularReference(referencedTemplateId, templateId, visited)) {
            throw new InvalidOperationException("Circular template reference detected");
        }
    }

    private boolean hasCircularReference(Long currentId, Long targetId, Set<Long> visited) {
        if (currentId.equals(targetId)) return true;
        if (visited.contains(currentId)) return false;
        visited.add(currentId);
        
        List<TemplateContent> contents = templateContentRepository.findByTemplateId(currentId);
        for (TemplateContent content : contents) {
            if (content.getReferencedTemplate() != null) {
                if (hasCircularReference(content.getReferencedTemplate().getId(), targetId, visited)) {
                    return true;
                }
            }
        }
        return false;
    }



    private void mapRequestToEntity(TemplateRequest request, ItemTemplate template) {
        template.setName(request.getName());
        template.setCategory(request.getCategory());
        template.setItem(request.getItem());
        template.setQuality(request.getQuality());
        template.setDescription(request.getDescription());
        template.setPriceInCopper(CurrencyUtil.toCopperValue(
            request.getGold(), request.getSilver(), request.getCopper()));
        template.setQuantity(request.getQuantity());
        template.setWeight(request.getWeight());
        template.setIsContainer(request.getIsContainer() != null && request.getIsContainer());
    }

    private TemplateResponse toResponse(ItemTemplate template) {
        return new TemplateResponse(template);
    }

    private TemplateResponse toResponseWithContents(ItemTemplate template) {
        TemplateResponse response = new TemplateResponse(template);
        List<TemplateContent> contents = templateContentRepository.findByTemplateId(template.getId());
        response.setContents(contents.stream()
                .map(TemplateContentResponse::new)
                .collect(Collectors.toList()));
        return response;
    }

    private ItemTemplate findTemplateOrThrow(Long id) {
        return itemTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
    }
}
