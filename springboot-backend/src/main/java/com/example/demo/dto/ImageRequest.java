package com.example.demo.dto;

public class ImageRequest {
    private String prompt;
    private String model = "flux";
    private String assetType = "";
    private String artStyle = "";
    private String perspective = "";
    private boolean transparent = false;
    private String ratio = "1:1";

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getArtStyle() { return artStyle; }
    public void setArtStyle(String artStyle) { this.artStyle = artStyle; }
    public String getPerspective() { return perspective; }
    public void setPerspective(String perspective) { this.perspective = perspective; }
    public boolean isTransparent() { return transparent; }
    public void setTransparent(boolean transparent) { this.transparent = transparent; }
    public String getRatio() { return ratio; }
    public void setRatio(String ratio) { this.ratio = ratio; }
}
