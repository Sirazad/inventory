package com.inventory.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class SystemBackupService {
    
    @Value("${spring.datasource.url}")
    private String datasourceUrl;
    
    @Value("${spring.datasource.username}")
    private String dbUsername;
    
    @Value("${spring.datasource.password}")
    private String dbPassword;
    
    @Value("${backup.directory:/tmp/backups}")
    private String backupDirectory;
    
    private static final DateTimeFormatter FILENAME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
    
    /**
     * Creates a full database backup using pg_dump
     * @return Path to the backup file
     * @throws IOException if backup fails
     */
    public Path createDatabaseBackup() throws IOException {
        // Create backup directory if it doesn't exist
        Path backupDir = Paths.get(backupDirectory);
        if (!Files.exists(backupDir)) {
            Files.createDirectories(backupDir);
        }
        
        // Generate backup filename with timestamp
        String timestamp = LocalDateTime.now().format(FILENAME_FORMATTER);
        String backupFilename = String.format("inventory_backup_%s.dump", timestamp);
        Path backupFilePath = backupDir.resolve(backupFilename);
        
        // Extract database connection info
        DatabaseInfo dbInfo = extractDatabaseInfo();
        
        // Build pg_dump command
        List<String> command = new ArrayList<>();
        command.add("pg_dump");
        command.add("-h");
        command.add(dbInfo.host);
        command.add("-p");
        command.add(String.valueOf(dbInfo.port));
        command.add("-U");
        command.add(dbUsername);
        command.add("-d");
        command.add(dbInfo.database);
        command.add("-F");
        command.add("c"); // custom format
        command.add("-f");
        command.add(backupFilePath.toString());
        
        // Set PGPASSWORD environment variable
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("PGPASSWORD", dbPassword);
        processBuilder.redirectErrorStream(true);
        
        // Execute pg_dump
        Process process = processBuilder.start();
        
        // Read output
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }
        
        // Wait for completion
        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("pg_dump failed with exit code " + exitCode + ": " + output);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Backup interrupted", e);
        }
        
        return backupFilePath;
    }
    
    /**
     * Lists all available backup files
     * @return List of backup file paths
     * @throws IOException if directory cannot be read
     */
    public List<Path> listBackups() throws IOException {
        Path backupDir = Paths.get(backupDirectory);
        if (!Files.exists(backupDir)) {
            return new ArrayList<>();
        }
        
        List<Path> backups = new ArrayList<>();
        try (var stream = Files.list(backupDir)) {
            stream.filter(path -> path.toString().endsWith(".dump"))
                  .forEach(backups::add);
        }
        return backups;
    }
    
    /**
     * Deletes old backup files, keeping only the most recent ones
     * @param keepCount Number of recent backups to keep
     * @throws IOException if deletion fails
     */
    public void cleanupOldBackups(int keepCount) throws IOException {
        List<Path> backups = listBackups();
        if (backups.size() <= keepCount) {
            return;
        }
        
        // Sort by modification time (newest first)
        backups.sort((a, b) -> {
            try {
                return Files.getLastModifiedTime(b).compareTo(Files.getLastModifiedTime(a));
            } catch (IOException e) {
                return 0;
            }
        });
        
        // Delete old backups
        for (int i = keepCount; i < backups.size(); i++) {
            Files.deleteIfExists(backups.get(i));
        }
    }
    
    /**
     * Extracts host:port/database from JDBC URL with proper error handling
     * @return DatabaseInfo object with connection details
     * @throws IllegalArgumentException if URL format is invalid
     */
    private DatabaseInfo extractDatabaseInfo() {
        // Format: jdbc:postgresql://host:port/database
        if (!datasourceUrl.startsWith("jdbc:postgresql://")) {
            throw new IllegalArgumentException("Invalid PostgreSQL JDBC URL format");
        }
        
        String connectionString = datasourceUrl.replace("jdbc:postgresql://", "");
        
        // Split by / to separate host:port from database
        String[] parts = connectionString.split("/", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid JDBC URL: missing database name");
        }
        
        String hostPort = parts[0];
        String database = parts[1];
        
        // Split host and port
        String[] hostPortParts = hostPort.split(":", 2);
        String host = hostPortParts[0];
        int port = hostPortParts.length > 1 ? Integer.parseInt(hostPortParts[1]) : 5432;
        
        return new DatabaseInfo(host, port, database);
    }
    
    /**
     * Inner class to hold database connection information
     */
    private static class DatabaseInfo {
        final String host;
        final int port;
        final String database;
        
        DatabaseInfo(String host, int port, String database) {
            this.host = host;
            this.port = port;
            this.database = database;
        }
    }
}
