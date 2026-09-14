package lk.tideline.cleanup.service;

import lk.tideline.cleanup.config.TidelineProperties;
import lk.tideline.cleanup.model.AccountDocument;
import lk.tideline.cleanup.model.User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Stores diver certificates on disk. Files are accepted only when their contents really are a PDF,
 * JPEG or PNG, and are saved under generated names so an upload can never choose its own path.
 */
@Service
public class DocumentStorageService {

    public static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    public static final int MAX_FILES = 5;

    private final Path root;

    public DocumentStorageService(TidelineProperties properties) {
        this.root = Paths.get(properties.getUploads().getDirectory()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create the upload directory " + root, e);
        }
    }

    /** An upload that passed validation, held in memory until its account is saved. */
    public record CheckedFile(String originalName, String contentType, String extension, byte[] bytes) {
    }

    private record FileType(String contentType, String extension) {
    }

    public List<CheckedFile> check(List<MultipartFile> files) {
        List<MultipartFile> present = files == null
                ? List.of()
                : files.stream().filter(file -> file != null && !file.isEmpty()).toList();

        if (present.size() > MAX_FILES) {
            throw new IllegalArgumentException("Attach up to " + MAX_FILES + " files.");
        }

        List<CheckedFile> checked = new ArrayList<>();
        for (MultipartFile file : present) {
            String name = displayName(file.getOriginalFilename());
            if (file.getSize() > MAX_FILE_BYTES) {
                throw new IllegalArgumentException(name + " is larger than 5 MB.");
            }
            byte[] bytes;
            try {
                bytes = file.getBytes();
            } catch (IOException e) {
                throw new IllegalArgumentException("Could not read " + name + ". Try attaching it again.");
            }
            FileType type = detect(bytes);
            if (type == null) {
                throw new IllegalArgumentException(name + " is not a PDF, JPG or PNG file.");
            }
            checked.add(new CheckedFile(name, type.contentType(), type.extension(), bytes));
        }
        return checked;
    }

    public AccountDocument save(User owner, CheckedFile file) {
        String storedName = UUID.randomUUID() + file.extension();
        write(storedName, file.bytes());

        AccountDocument document = new AccountDocument();
        document.setUser(owner);
        document.setOriginalName(file.originalName());
        document.setStoredName(storedName);
        document.setContentType(file.contentType());
        document.setSizeBytes(file.bytes().length);
        return document;
    }

    public void write(String storedName, byte[] bytes) {
        try {
            Files.write(resolve(storedName), bytes);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save an uploaded file.", e);
        }
    }

    public byte[] read(AccountDocument document) {
        try {
            return Files.readAllBytes(resolve(document.getStoredName()));
        } catch (NoSuchFileException e) {
            throw new NotFoundException("That file is no longer on the server.");
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read that file.", e);
        }
    }

    private Path resolve(String storedName) {
        Path path = root.resolve(storedName).normalize();
        if (!path.startsWith(root) || path.equals(root)) {
            throw new IllegalArgumentException("Invalid file reference.");
        }
        return path;
    }

    private static FileType detect(byte[] bytes) {
        if (startsWith(bytes, 0x25, 0x50, 0x44, 0x46)) {
            return new FileType("application/pdf", ".pdf");
        }
        if (startsWith(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return new FileType("image/png", ".png");
        }
        if (startsWith(bytes, 0xFF, 0xD8, 0xFF)) {
            return new FileType("image/jpeg", ".jpg");
        }
        return null;
    }

    private static boolean startsWith(byte[] data, int... signature) {
        if (data.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((data[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private static String displayName(String original) {
        String name = StringUtils.getFilename(StringUtils.cleanPath(original == null ? "" : original));
        name = name == null ? "" : name.replaceAll("[\\p{Cntrl}\"\\\\]", "").trim();
        if (name.isEmpty()) {
            return "file";
        }
        return name.length() > 150 ? name.substring(name.length() - 150) : name;
    }
}
