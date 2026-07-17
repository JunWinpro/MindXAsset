package com.example.demo.controller;

import com.example.demo.dto.ImageRequest;
import com.example.demo.dto.ImageResponse;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow frontend to call
public class GenerateImageController {

    @Value("${pollinations.api.key:}")
    private String pollinationsApiKey;

    @Value("${huggingface.api.key:}")
    private String huggingfaceApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/generate-image")
    public ResponseEntity<?> generateImage(@RequestBody ImageRequest request) {
        if (request.getPrompt() == null || request.getPrompt().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Vui lòng cung cấp prompt.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            String finalPrompt = request.getPrompt() + ", " + request.getAssetType() + ", " + 
                                 request.getArtStyle() + " style, " + request.getPerspective() + " perspective";
            
            String targetModel = request.getModel();
            if (targetModel == null || targetModel.isEmpty()) {
                targetModel = "flux";
            }

            // Include API Key (for both text and image endpoints)
            HttpHeaders headers = new HttpHeaders();
            if (pollinationsApiKey != null && !pollinationsApiKey.isEmpty()) {
                headers.set("Authorization", "Bearer " + pollinationsApiKey);
            }
            HttpEntity<String> entity = new HttpEntity<>(headers);

            if ("gemini".equalsIgnoreCase(targetModel)) {
                try {
                    String geminiInstruction = "Write a highly detailed English image generation prompt for a game asset. Idea: " 
                            + request.getPrompt() + ". It must be a " + request.getAssetType() + " in " 
                            + request.getArtStyle() + " style, from a " + request.getPerspective() 
                            + " perspective. Provide ONLY the prompt text, no intro/outro.";
                    
                    String textUrl = "https://text.pollinations.ai/" + URLEncoder.encode(geminiInstruction, StandardCharsets.UTF_8.toString());
                    
                    HttpEntity<String> textEntity = new HttpEntity<>(headers);
                    ResponseEntity<String> textResponse = restTemplate.exchange(textUrl, HttpMethod.GET, textEntity, String.class);
                    if (textResponse.getStatusCode().is2xxSuccessful() && textResponse.getBody() != null) {
                        finalPrompt = textResponse.getBody();
                        System.out.println("Gemini enhanced prompt: " + finalPrompt);
                    }
                } catch (Exception e) {
                    System.out.println("Lỗi khi dùng Gemini tối ưu prompt: " + e.getMessage());
                }
                targetModel = "flux";
            }
            
            String encodedPrompt = URLEncoder.encode(finalPrompt, StandardCharsets.UTF_8.toString());
            String url = "https://image.pollinations.ai/prompt/" + encodedPrompt + "?model=" + targetModel;
            
            if ("16:9".equals(request.getRatio())) url += "&width=1024&height=576";
            else if ("9:16".equals(request.getRatio())) url += "&width=576&height=1024";
            else url += "&width=1024&height=1024";


            if (request.isTransparent()) {
                url += "&transparent=true";
            }


            System.out.println("Fetching image from: " + url);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, byte[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String base64Image = Base64.getEncoder().encodeToString(response.getBody());
                String imageSrc = "data:image/jpeg;base64," + base64Image;
                return ResponseEntity.ok(new ImageResponse(imageSrc));
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Lỗi từ Pollinations API.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
            }

        } catch (HttpClientErrorException e) {
            Map<String, String> error = new HashMap<>();
            if (e.getStatusCode().value() == 401) {
                error.put("error", "Pollinations API bắt buộc phải có API Key. (401)");
                return ResponseEntity.status(401).body(error);
            } else if (e.getStatusCode().value() == 402) {
                error.put("error", "Payment Required: Hết pollen.");
                return ResponseEntity.status(402).body(error);
            } else if (e.getStatusCode().value() == 429) {
                error.put("error", "Too Many Requests: Tạo ảnh quá nhanh.");
                return ResponseEntity.status(429).body(error);
            }
            error.put("error", "Lỗi HTTP: " + e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lỗi máy chủ nội bộ. Không thể kết nối tới Pollinations.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/generate-image-hf")
    public ResponseEntity<?> generateImageHf(@RequestBody ImageRequest request) {
        if (request.getPrompt() == null || request.getPrompt().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Vui lòng cung cấp prompt.");
            return ResponseEntity.badRequest().body(error);
        }

        if (huggingfaceApiKey == null || huggingfaceApiKey.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Chưa cấu hình HUGGINGFACE_API_KEY trong application.properties");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        try {
            String finalPrompt = request.getPrompt() + ", " + request.getAssetType() + ", " + 
                                 request.getArtStyle() + " style, " + request.getPerspective() + " perspective";
            
            String url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + huggingfaceApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, String> body = new HashMap<>();
            body.put("inputs", finalPrompt);
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, byte[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String base64Image = Base64.getEncoder().encodeToString(response.getBody());
                String imageSrc = "data:image/jpeg;base64," + base64Image;
                return ResponseEntity.ok(new ImageResponse(imageSrc));
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Lỗi từ Hugging Face API.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lỗi khi gọi Hugging Face API.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
