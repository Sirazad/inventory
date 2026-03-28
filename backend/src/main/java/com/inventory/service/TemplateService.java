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
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TemplateService {

    private static final int MAX_PAGE_SIZE = 100;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "id", "name", "category", "item", "quality",
        "priceInCopper", "quantity", "weight", "isContainer",
        "createdAt", "updatedAt"
    );

    private final ItemTemplateRepository itemTemplateRepository;
    private final TemplateContentRepository templateContentRepository;
    private final CharacterRepository characterRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final CalendarService calendarService;

    public TemplateService(ItemTemplateRepository itemTemplateRepository,
                          TemplateContentRepository templateContentRepository,
                          CharacterRepository characterRepository,
                          InventoryRepository inventoryRepository,
                          UserRepository userRepository,
                          CalendarService calendarService) {
        this.itemTemplateRepository = itemTemplateRepository;
        this.templateContentRepository = templateContentRepository;
        this.characterRepository = characterRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.calendarService = calendarService;
    }

    // Search with pagination
    @Transactional(readOnly = true)
    public Page<TemplateResponse> searchTemplates(
            String name, Boolean isContainer, String category,
            int page, int size, String sortBy, String sortDir) {
        
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new InvalidOperationException(
                "Invalid sort field: '" + sortBy + "'. Allowed values: " + ALLOWED_SORT_FIELDS);
        }

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

        if (!template.getName().equals(request.getName()) &&
            itemTemplateRepository.existsByName(request.getName())) {
            throw new InvalidOperationException("Template with name '" + request.getName() + "' already exists");
        }

        mapRequestToEntity(request, template);
        itemTemplateRepository.save(template);

        boolean isContainer = request.getIsContainer() != null && request.getIsContainer();

        if (isContainer && request.getContents() != null && !request.getContents().isEmpty()) {
            Map<Long, TemplateContent> existingById = templateContentRepository.findByTemplateId(id)
                .stream().collect(Collectors.toMap(TemplateContent::getId, c -> c));

            Set<Long> requestedIds = request.getContents().stream()
                .filter(c -> c.getId() != null)
                .map(TemplateContentRequest::getId)
                .collect(Collectors.toSet());

            // Delete rows that are no longer present in the request
            existingById.keySet().stream()
                .filter(existingId -> !requestedIds.contains(existingId))
                .forEach(templateContentRepository::deleteById);

            for (TemplateContentRequest contentReq : request.getContents()) {
                TemplateContent existing = contentReq.getId() != null ? existingById.get(contentReq.getId()) : null;
                if (existing != null) {
                    updateTemplateContent(existing, template, contentReq);
                } else {
                    createTemplateContent(template, contentReq);
                }
            }
        } else {
            templateContentRepository.deleteByTemplateId(id);
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

        templateContentRepository.deleteByTemplateId(id);
        itemTemplateRepository.delete(template);
        log.info("Template deleted: {} (ID: {})", name, id);
    }

    // Instantiate template to inventory with recursive resolution
    @Transactional
    public InventoryResponse addTemplateToInventory(String username, Long characterId, Long templateId) {
        log.debug("Adding template ID {} to character ID {} inventory", templateId, characterId);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        com.inventory.entity.Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
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
        return toInventoryResponse(savedMain);
    }

    // Private helper methods

    private void createTemplateContent(ItemTemplate template, TemplateContentRequest contentReq) {
        TemplateContent content = new TemplateContent();
        content.setTemplate(template);
        applyContentRequest(content, template, contentReq);
        templateContentRepository.save(content);
    }

    private void updateTemplateContent(TemplateContent content, ItemTemplate template, TemplateContentRequest contentReq) {
        applyContentRequest(content, template, contentReq);
        templateContentRepository.save(content);
    }

    private void applyContentRequest(TemplateContent content, ItemTemplate template, TemplateContentRequest contentReq) {
        // Reset both modes so switching reference ↔ direct never leaves stale fields
        content.setReferencedTemplate(null);
        content.setQuantityOverride(null);
        content.setCategory(null);
        content.setItem(null);
        content.setQuality(null);
        content.setDescription(null);
        content.setPriceInCopper(null);
        content.setQuantity(null);
        content.setWeight(null);

        if (contentReq.getReferencedTemplateId() != null) {
            validateNoCircularReference(template.getId(), contentReq.getReferencedTemplateId());
            if (contentReq.getQuantityOverride() != null && contentReq.getQuantityOverride() < 1) {
                throw new InvalidOperationException("Quantity override must be at least 1");
            }
            ItemTemplate refTemplate = findTemplateOrThrow(contentReq.getReferencedTemplateId());
            content.setReferencedTemplate(refTemplate);
            content.setQuantityOverride(contentReq.getQuantityOverride());
        } else {
            if (contentReq.getCategory() == null || contentReq.getCategory().isBlank()
                    || contentReq.getItem() == null || contentReq.getItem().isBlank()) {
                throw new InvalidOperationException(
                    "Template content must have either referenced_template_id OR category and item");
            }
            if (contentReq.getDescription() == null || contentReq.getDescription().isBlank()) {
                throw new InvalidOperationException(
                    "Template content in direct mode must have a description");
            }
            if (contentReq.getQuantity() == null || contentReq.getQuantity() < 1) {
                throw new InvalidOperationException(
                    "Template content in direct mode must have a quantity of at least 1");
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
        if (hasCircularReference(referencedTemplateId, templateId)) {
            throw new InvalidOperationException("Circular template reference detected");
        }
    }

    /**
     * BFS reachability check: returns true if targetId is reachable from startId
     * through the template reference graph. Loads one level at a time to avoid N+1 queries.
     */
    private boolean hasCircularReference(Long startId, Long targetId) {
        if (startId.equals(targetId)) return true;

        Set<Long> toVisit = new HashSet<>();
        toVisit.add(startId);
        Set<Long> visited = new HashSet<>();

        while (!toVisit.isEmpty()) {
            List<TemplateContent> contents = templateContentRepository.findByTemplateIdIn(toVisit);
            visited.addAll(toVisit);
            toVisit = new HashSet<>();

            for (TemplateContent content : contents) {
                if (content.getReferencedTemplate() != null) {
                    Long refId = content.getReferencedTemplate().getId();
                    if (refId.equals(targetId)) return true;
                    if (!visited.contains(refId)) toVisit.add(refId);
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

    private InventoryResponse toInventoryResponse(Inventory inv) {
        InventoryResponse r = new InventoryResponse();
        r.setId(inv.getId());
        r.setCategory(inv.getCategory());
        r.setItem(inv.getItem());
        r.setQuality(inv.getQuality());
        r.setDescription(inv.getDescription());
        r.setPriceInCopper(inv.getPriceInCopper());
        r.setGold(inv.getGold());
        r.setSilver(inv.getSilver());
        r.setCopper(inv.getCopper());
        r.setQuantity(inv.getQuantity());
        r.setAddedUpdated(inv.getAddedUpdated());
        r.setWeight(inv.getWeight());
        r.setContainerId(inv.getContainerId());
        r.setRemoved(inv.getRemoved());
        r.setRemovedText(inv.getRemovedText());
        r.setAddedYear(inv.getAddedYear());
        r.setAddedDay(inv.getAddedDay());
        r.setModifiedYear(inv.getModifiedYear());
        r.setModifiedDay(inv.getModifiedDay());
        r.setRemovedYear(inv.getRemovedYear());
        r.setRemovedDay(inv.getRemovedDay());
        r.setCreatedAt(inv.getCreatedAt());
        r.setUpdatedAt(inv.getUpdatedAt());
        if (inv.getAddedYear() != null && inv.getAddedDay() != null) {
            try {
                var calendarMonth = calendarService.getCalendarMonth(inv.getAddedDay());
                r.setAddedGodName(calendarMonth.getGodName());
                r.setAddedGodMonthNumber(calendarMonth.getGodMonthNumber());
                r.setAddedSeason(calendarMonth.getSeason());
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave fields as null
                r.setAddedGodName(null);
                r.setAddedGodMonthNumber(null);
                r.setAddedSeason(null);
            }
        }
        if (inv.getModifiedYear() != null && inv.getModifiedDay() != null) {
            try {
                var calendarMonth = calendarService.getCalendarMonth(inv.getModifiedDay());
                r.setModifiedGodName(calendarMonth.getGodName());
                r.setModifiedGodMonthNumber(calendarMonth.getGodMonthNumber());
                r.setModifiedSeason(calendarMonth.getSeason());
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave fields as null
                r.setModifiedGodName(null);
                r.setModifiedGodMonthNumber(null);
                r.setModifiedSeason(null);
            }
        }
        return r;
    }

    private ItemTemplate findTemplateOrThrow(Long id) {
        return itemTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
    }
}
