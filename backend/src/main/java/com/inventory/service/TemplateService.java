package com.inventory.service;

import com.inventory.dto.TemplateItemRequest;
import com.inventory.dto.TemplateItemResponse;
import com.inventory.dto.TemplateRequest;
import com.inventory.dto.TemplateResponse;
import com.inventory.entity.Character;
import com.inventory.entity.Inventory;
import com.inventory.entity.ItemTemplate;
import com.inventory.entity.TemplateItem;
import com.inventory.entity.User;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.CharacterRepository;
import com.inventory.repository.InventoryRepository;
import com.inventory.repository.ItemTemplateRepository;
import com.inventory.repository.TemplateItemRepository;
import com.inventory.repository.UserRepository;
import com.inventory.util.CurrencyUtil;
import com.inventory.dto.InventoryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TemplateService {

    private final ItemTemplateRepository itemTemplateRepository;
    private final TemplateItemRepository templateItemRepository;
    private final UserRepository userRepository;
    private final CharacterRepository characterRepository;
    private final InventoryRepository inventoryRepository;
    private final PyarrCalendarService pyarrCalendarService;

    public TemplateService(ItemTemplateRepository itemTemplateRepository,
                          TemplateItemRepository templateItemRepository,
                          UserRepository userRepository,
                          CharacterRepository characterRepository,
                          InventoryRepository inventoryRepository,
                          PyarrCalendarService pyarrCalendarService) {
        this.itemTemplateRepository = itemTemplateRepository;
        this.templateItemRepository = templateItemRepository;
        this.userRepository = userRepository;
        this.characterRepository = characterRepository;
        this.inventoryRepository = inventoryRepository;
        this.pyarrCalendarService = pyarrCalendarService;
    }

    public List<TemplateResponse> searchTemplates(String username, String name) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<ItemTemplate> templates;
        if (name != null && !name.isEmpty()) {
            templates = itemTemplateRepository.searchByName(name, user.getId());
        } else {
            templates = itemTemplateRepository.findAllAccessibleTemplates(user.getId());
        }

        return templates.stream()
                .map(template -> {
                    TemplateResponse response = new TemplateResponse(template);
                    List<TemplateItem> items = templateItemRepository.findByTemplateId(template.getId());
                    response.setItems(items.stream()
                            .map(TemplateItemResponse::new)
                            .collect(Collectors.toList()));
                    return response;
                })
                .collect(Collectors.toList());
    }

    public TemplateResponse getTemplate(String username, Long templateId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ItemTemplate template = itemTemplateRepository.findByIdAndUserIdOrSystem(templateId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        TemplateResponse response = new TemplateResponse(template);
        List<TemplateItem> items = templateItemRepository.findByTemplateId(template.getId());
        response.setItems(items.stream()
                .map(TemplateItemResponse::new)
                .collect(Collectors.toList()));
        return response;
    }

    public List<TemplateItemResponse> getTemplateContents(String username, Long templateId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ItemTemplate template = itemTemplateRepository.findByIdAndUserIdOrSystem(templateId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        List<TemplateItem> items = templateItemRepository.findByTemplateId(template.getId());
        return items.stream()
                .map(TemplateItemResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public TemplateResponse createTemplate(String username, TemplateRequest request) {
        log.debug("Creating template '{}' for user {}", request.getName(), username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ItemTemplate template = new ItemTemplate();
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
        template.setUser(user);

        ItemTemplate saved = itemTemplateRepository.save(template);

        // Add items if this is a container template
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (TemplateItemRequest itemRequest : request.getItems()) {
                TemplateItem item = new TemplateItem();
                item.setTemplate(saved);
                item.setCategory(itemRequest.getCategory());
                item.setItem(itemRequest.getItem());
                item.setQuality(itemRequest.getQuality());
                item.setDescription(itemRequest.getDescription());
                item.setPriceInCopper(CurrencyUtil.toCopperValue(
                        itemRequest.getGold(), itemRequest.getSilver(), itemRequest.getCopper()));
                item.setQuantity(itemRequest.getQuantity());
                item.setWeight(itemRequest.getWeight());
                templateItemRepository.save(item);
            }
        }

        log.info("Template created: {} (ID: {}) for user {}", saved.getName(), saved.getId(), username);
        return getTemplate(username, saved.getId());
    }

    @Transactional
    public void deleteTemplate(String username, Long templateId) {
        log.info("Deleting template ID {} for user {}", templateId, username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ItemTemplate template = itemTemplateRepository.findByIdAndUserId(templateId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Template not found or not owned by user"));

        itemTemplateRepository.delete(template);
        log.info("Template deleted: {} (ID: {})", template.getName(), templateId);
    }

    @Transactional
    public InventoryResponse addTemplateToInventory(String username, Long characterId, Long templateId) {
        log.debug("Adding template ID {} to character ID {} inventory", templateId, characterId);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        ItemTemplate template = itemTemplateRepository.findByIdAndUserIdOrSystem(templateId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        // Create the main item from template
        Inventory mainItem = new Inventory();
        mainItem.setCategory(template.getCategory());
        mainItem.setItem(template.getItem());
        mainItem.setQuality(template.getQuality());
        mainItem.setDescription(template.getDescription());
        mainItem.setPriceInCopper(template.getPriceInCopper());
        mainItem.setQuantity(template.getQuantity());
        mainItem.setWeight(template.getWeight());
        mainItem.setCharacter(character);
        mainItem.setAddedYear(character.getCurrentYear());
        mainItem.setAddedDay(character.getCurrentDay());

        Inventory savedMainItem = inventoryRepository.save(mainItem);

        // If template is a container, add the items inside it
        if (template.getIsContainer()) {
            List<TemplateItem> templateItems = templateItemRepository.findByTemplateId(template.getId());
            for (TemplateItem templateItem : templateItems) {
                Inventory containedItem = new Inventory();
                containedItem.setCategory(templateItem.getCategory());
                containedItem.setItem(templateItem.getItem());
                containedItem.setQuality(templateItem.getQuality());
                containedItem.setDescription(templateItem.getDescription());
                containedItem.setPriceInCopper(templateItem.getPriceInCopper());
                containedItem.setQuantity(templateItem.getQuantity());
                containedItem.setWeight(templateItem.getWeight());
                containedItem.setCharacter(character);
                containedItem.setContainer(savedMainItem);
                containedItem.setAddedYear(character.getCurrentYear());
                containedItem.setAddedDay(character.getCurrentDay());
                inventoryRepository.save(containedItem);
            }
        }

        log.info("Template '{}' added to character ID {} inventory", template.getName(), characterId);
        return new InventoryResponse(savedMainItem, pyarrCalendarService);
    }
}
