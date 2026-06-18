package com.capstone.deepterview.global.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

public class DocumentParser {

    public static String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("파일 이름이 존재하지 않습니다.");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        try (InputStream is = file.getInputStream()) {
            if ("pdf".equals(extension)) {
                return extractTextFromPdf(is);
            } else if ("docx".equals(extension)) {
                return extractTextFromDocx(is);
            } else {
                throw new IllegalArgumentException("지원하지 않는 파일 형식입니다: " + extension + " (.pdf, .docx 형식만 지원합니다)");
            }
        }
    }

    private static String extractTextFromPdf(InputStream is) throws IOException {
        try (PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private static String extractTextFromDocx(InputStream is) throws IOException {
        try (XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
}
