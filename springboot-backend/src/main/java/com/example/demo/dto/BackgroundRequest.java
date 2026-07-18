package com.example.demo.dto;

public class BackgroundRequest {
    private String subject;
    private String size_key = "background_hd";
    private String style = "pixel_art";
    private String time_of_day = "day";
    private int seed = -1;
    private String filename = "";

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getSize_key() { return size_key; }
    public void setSize_key(String size_key) { this.size_key = size_key; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getTime_of_day() { return time_of_day; }
    public void setTime_of_day(String time_of_day) { this.time_of_day = time_of_day; }

    public int getSeed() { return seed; }
    public void setSeed(int seed) { this.seed = seed; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
}
