package com.example.demo.dto;

public class ImageResponse {
    private String image;

    public ImageResponse(String image) {
        this.image = image;
    }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}
